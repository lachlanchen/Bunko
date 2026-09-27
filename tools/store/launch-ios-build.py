#!/usr/bin/env python3
"""Launch one headless archive in the Mac user's audit session (required by Keychain)."""
import os, pathlib, plistlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parents[2]
label = 'art.bunko.archive'
domain = f'gui/{os.getuid()}'
previous = subprocess.run(['launchctl', 'print', f'{domain}/{label}'], capture_output=True, text=True)
if previous.returncode == 0:
    if 'state = running' in previous.stdout:
        raise SystemExit('The Bunko archive is already running.')
    subprocess.run(['launchctl','bootout',f'{domain}/{label}'],check=True)
(root/'release').mkdir(exist_ok=True)
job = root/'release/archive-agent.plist'
log = root/'release/archive.log'
if log.exists(): log.replace(root/'release/archive.previous.log')
platform = sys.argv[1] if len(sys.argv) > 1 else 'ios'
if platform not in ('ios', 'macos'): raise SystemExit('Expected ios or macos')
env = {'HOME':str(pathlib.Path.home()),'PATH':'/usr/bin:/bin:/usr/sbin:/sbin', 'BUNKO_BUILD_JOBS':'1'}
job.write_bytes(plistlib.dumps({'Label': label, 'ProgramArguments':['/bin/bash',str(root/f'tools/store/build-{platform}.sh')], 'WorkingDirectory':str(root), 'RunAtLoad':True, 'ProcessType':'Background', 'StandardOutPath':str(log),'StandardErrorPath':str(log),'EnvironmentVariables':env}))
subprocess.run(['launchctl','bootstrap',domain,str(job)],check=True)
print(f'Bunko archive started. Inspect {log}; cleanup: launchctl bootout {domain}/{label}')
