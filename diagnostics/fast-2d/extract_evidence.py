"""Read a local evidence export; emit only bounded, allowlisted diagnostics. No network."""
import argparse, base64, hashlib, json
from collections import Counter
from pathlib import Path

EXPECTED = '6774364407af551852dab89ad891eda73e83eeaa21ffe4da2f13dcd167f15abe'
SOURCE = 'cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e'
def extract(path):
    data = Path(path).read_bytes()
    assert hashlib.sha256(data).hexdigest() == EXPECTED
    x = json.loads(data)
    assert hashlib.sha256(base64.b64decode(x['steps']['T01']['raw']['data']['contract_code'])).hexdigest() == SOURCE
    summary = {'evidence_sha256': EXPECTED, 'deployed_source_sha256': SOURCE,
               'exported_at': x['exportedAt'], 'contract': x['deployment'], 'transactions': [], 'rounds': []}
    for key, step in x['steps'].items():
        raw = step['raw']
        summary['transactions'].append({'step': key, 'hash': step['hash'], 'status': raw['status'],
          'result_name': raw['result_name'], 'rotation_count': raw['rotation_count'],
          'leader_only': raw['leader_only'], 'appealed': raw['appealed'],
          'captured_network_fee': step.get('actualFee', {}).get('networkFee'),
          'has_post_transaction_reads': 'reads' in step})
    t = x['steps']['T04']['raw']
    fixture = {'provenance': 'CAPTURED REAL FAILURE: normalized R3 candidate, NOT raw model response',
       'evidence_sha256': EXPECTED,
       'candidate_path': '/steps/T04/raw/consensus_history/consensus_results/2/leader_result/0/eq_outputs/0',
       'parents': [{k: s['reads']['work'][k] for k in ('id', 'name', 'description', 'features')}
                   for s in (x['steps']['T02'], x['steps']['T03'])]}
    for i, r in enumerate(t['consensus_history']['consensus_results'], 1):
        leader = r['leader_result'][0]
        row = {'round': i, 'leader_execution': leader['execution_result'],
          'leader_json_decode_error': 'JSONDecodeError: Expecting value: line 1 column 1 (char 0)' in leader['genvm_result']['stderr'],
          'external_votes': dict(Counter(v['vote'] for v in r['validator_results'])),
          'all_votes': dict(Counter(v['vote'] for v in r['leader_result'][1:] + r['validator_results'])),
          'outcome': r['consensus_round'], 'receipts': []}
        for role, receipts in [('leader', r['leader_result'][:1]), ('leader_self_validation', r['leader_result'][1:]), ('external_validator', r['validator_results'])]:
            for j, v in enumerate(receipts):
                stats = v.get('execution_stats') or {}
                row['receipts'].append({'role': role, 'index': j, 'vote': v.get('vote'),
                   'execution_result': v['execution_result'], 'result_base64': v['result'],
                   'input_calldata_sha256': hashlib.sha256(base64.b64decode(v['calldata'])).hexdigest() if v['calldata'] else None,
                   'llm_tokens': list((stats.get('llm', {}).get('tokens') or {}).values()),
                   'nondet_disagree': v.get('nondet_disagree'),
                   'notify_nondet_disagreement': stats.get('call_counts', {}).get('NOTIFY_NONDET_DISAGREEMENT', 0),
                   'stderr': v['genvm_result']['stderr'], 'error_code': v['genvm_result'].get('error_code'),
                   'contract_state_hash': v.get('contract_state_hash')})
        summary['rounds'].append(row)
        if i == 3:
            b = base64.b64decode(leader['eq_outputs']['0'])
            # Exact observed envelope only, not a general-purpose protocol decoder.
            assert b[:3] == b'\x00\xfc7'
            candidate = json.loads(b[3:].decode('utf-8'))
            assert json.dumps(candidate, sort_keys=True, ensure_ascii=True, separators=(',', ':')).encode() == b[3:]
            fixture['candidate'] = candidate
            fixture['eq_payload_prefix_hex'] = b[:3].hex()
            fixture['candidate_sha256'] = hashlib.sha256(b[3:]).hexdigest()
    summary['raw_failed_model_outputs_available'] = False
    summary['raw_validator_reviews_available'] = False
    summary['post_T04_state_read_available'] = False
    return summary, fixture

if __name__ == '__main__':
    p = argparse.ArgumentParser(); p.add_argument('evidence'); p.add_argument('--output', required=True)
    a = p.parse_args(); out = Path(a.output); out.mkdir(parents=True, exist_ok=True)
    summary, fixture = extract(a.evidence)
    for name, obj in [('evidence_summary.json', summary), ('captured_round3.json', fixture)]:
        (out/name).write_text(json.dumps(obj, indent=2, ensure_ascii=False)+'\n')
    print('Verified evidence and deployed source hashes; wrote allowlisted summary + R3 fixture.')
