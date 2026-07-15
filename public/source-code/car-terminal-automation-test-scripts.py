#!/usr/bin/env python3
"""
Reconstructed car-terminal automation test script.

This version is based on the test-development resume notes:
- wait for serial keyword `sleepAck`
- send a CAN wake-up frame
- reconnect the Windows Wi-Fi profile
- SSH into the terminal and run a ping check
- repeat for multiple cycles and write traceable results
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import shutil
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    import can  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    can = None

try:
    import serial  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    serial = None


LOG = logging.getLogger("car_terminal_auto_test")


@dataclass(slots=True)
class TestConfig:
    serial_port: str
    serial_baudrate: int = 115200
    serial_timeout: float = 0.2
    sleep_keyword: str = "sleepAck"
    sleep_timeout: float = 60.0
    wake_delay: float = 6.0
    wifi_profile: str = ""
    wifi_ssid: str = ""
    wifi_timeout: float = 45.0
    ssh_host: str = "192.168.0.1"
    ssh_user: str = "root"
    ssh_port: int = 22
    ssh_timeout: int = 20
    ping_target: str = "8.8.8.8"
    ping_count: int = 4
    can_channel: str = "PCAN_USBBUS1"
    can_bitrate: int = 500000
    wake_arbitration_id: int = 0x43B
    wake_data_hex: str = "0102030405060708"
    cycles: int = 50
    cycle_pause: float = 1.0
    continue_on_failure: bool = True
    output_dir: Path = Path("tmp/car-terminal-auto-test")

    @property
    def wake_payload(self) -> bytes:
        return bytes.fromhex(self.wake_data_hex)


@dataclass(slots=True)
class CycleResult:
    cycle: int
    success: bool
    stage: str
    message: str
    duration_seconds: float
    timestamp: str
    sleep_marker: str = ""


class SerialKeywordWatcher:
    def __init__(self, port: str, baudrate: int, timeout: float) -> None:
        if serial is None:
            raise RuntimeError("pyserial is required to read serial keywords.")
        self._serial = serial.Serial(port=port, baudrate=baudrate, timeout=timeout)

    def wait_for_keyword(self, keyword: str, timeout_seconds: float) -> str:
        deadline = time.time() + timeout_seconds
        keyword_lower = keyword.lower()

        while time.time() < deadline:
            raw = self._serial.readline()
            if not raw:
                continue

            line = raw.decode(errors="ignore").strip()
            if not line:
                continue

            LOG.info("[serial] %s", line)
            if keyword_lower in line.lower():
                return line

        raise TimeoutError(f"Timed out waiting for serial keyword: {keyword}")

    def close(self) -> None:
        try:
            self._serial.close()
        except Exception:
            pass


class PcanWakeSender:
    def __init__(self, channel: str, bitrate: int) -> None:
        self._channel = channel
        self._bitrate = bitrate

    def send(self, arbitration_id: int, data: bytes) -> None:
        if can is not None:
            self._send_with_python_can(arbitration_id, data)
            return

        cansend = shutil.which("cansend")
        if cansend:
            frame = f"{arbitration_id:X}#{data.hex().upper()}"
            subprocess.run([cansend, self._channel, frame], check=True)
            return

        raise RuntimeError("Neither python-can nor cansend is available for CAN wake-up.")

    def _send_with_python_can(self, arbitration_id: int, data: bytes) -> None:
        bus = None
        try:
            bus = can.Bus(interface="pcan", channel=self._channel, bitrate=self._bitrate)
            message = can.Message(
                arbitration_id=arbitration_id,
                data=data,
                is_extended_id=False,
            )
            bus.send(message, timeout=1.0)
        except Exception as exc:
            LOG.warning("CAN send failed, retrying once: %s", exc)
            if bus is not None:
                try:
                    bus.shutdown()
                except Exception:
                    pass
            bus = can.Bus(interface="pcan", channel=self._channel, bitrate=self._bitrate)
            message = can.Message(
                arbitration_id=arbitration_id,
                data=data,
                is_extended_id=False,
            )
            bus.send(message, timeout=1.0)
        finally:
            if bus is not None:
                try:
                    bus.shutdown()
                except Exception:
                    pass


class WindowsWifiConnector:
    def __init__(self, profile: str, ssid: str = "") -> None:
        self.profile = profile
        self.ssid = ssid

    def connect(self) -> None:
        if not self.profile:
            raise ValueError("wifi_profile is required.")

        cmd = ["netsh", "wlan", "connect", f"name={self.profile}"]
        if self.ssid:
            cmd.append(f"ssid={self.ssid}")
        subprocess.run(cmd, check=True, capture_output=True, text=True, errors="ignore")

    def wait_connected(self, timeout_seconds: float) -> str:
        deadline = time.time() + timeout_seconds
        expected = self.ssid or self.profile

        while time.time() < deadline:
            result = subprocess.run(
                ["netsh", "wlan", "show", "interfaces"],
                check=False,
                capture_output=True,
                text=True,
                errors="ignore",
            )
            text = result.stdout or ""
            state = _read_netsh_value(text, ("State", "状态"))
            ssid = _read_netsh_value(text, ("SSID",))
            if state and _is_connected_state(state) and (not expected or expected in ssid):
                return text
            time.sleep(1.0)

        raise TimeoutError(f"Timed out waiting for Wi-Fi profile to connect: {self.profile}")


class SshPingRunner:
    def __init__(self, host: str, user: str, port: int, timeout: int) -> None:
        self.host = host
        self.user = user
        self.port = port
        self.timeout = timeout

    def run_ping(self, target: str, count: int) -> str:
        if not shutil.which("ssh"):
            raise RuntimeError("ssh command not found.")

        remote_command = f"ping -c {count} {target}"
        cmd = [
            "ssh",
            "-p",
            str(self.port),
            "-o",
            "BatchMode=yes",
            "-o",
            f"ConnectTimeout={self.timeout}",
            f"{self.user}@{self.host}",
            remote_command,
        ]
        result = subprocess.run(cmd, check=False, capture_output=True, text=True, errors="ignore")
        output = (result.stdout or "") + ("\n" + result.stderr if result.stderr else "")
        if result.returncode != 0:
            raise RuntimeError(f"SSH ping failed: {output.strip()}")
        return output.strip()


def _read_netsh_value(text: str, keys: tuple[str, ...]) -> str:
    for key in keys:
        match = re.search(rf"^\s*{re.escape(key)}\s*:\s*(.+?)\s*$", text, flags=re.MULTILINE)
        if match:
            return match.group(1).strip()
    return ""


def _is_connected_state(state: str) -> bool:
    normalized = state.strip().lower()
    return normalized in {"connected", "已连接", "已連線", "已連接"} or "connected" in normalized


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reconstructed car terminal automation test runner")
    parser.add_argument("--serial-port", required=True)
    parser.add_argument("--serial-baudrate", type=int, default=115200)
    parser.add_argument("--sleep-keyword", default="sleepAck")
    parser.add_argument("--sleep-timeout", type=float, default=60.0)
    parser.add_argument("--wake-delay", type=float, default=6.0)
    parser.add_argument("--wifi-profile", required=True)
    parser.add_argument("--wifi-ssid", default="")
    parser.add_argument("--wifi-timeout", type=float, default=45.0)
    parser.add_argument("--ssh-host", default="192.168.0.1")
    parser.add_argument("--ssh-user", default="root")
    parser.add_argument("--ssh-port", type=int, default=22)
    parser.add_argument("--ssh-timeout", type=int, default=20)
    parser.add_argument("--ping-target", default="8.8.8.8")
    parser.add_argument("--ping-count", type=int, default=4)
    parser.add_argument("--can-channel", default="PCAN_USBBUS1")
    parser.add_argument("--can-bitrate", type=int, default=500000)
    parser.add_argument("--wake-arbitration-id", default="0x43B")
    parser.add_argument("--wake-data-hex", default="0102030405060708")
    parser.add_argument("--cycles", type=int, default=50)
    parser.add_argument("--cycle-pause", type=float, default=1.0)
    parser.add_argument("--output-dir", default="tmp/car-terminal-auto-test")
    parser.add_argument("--stop-on-failure", action="store_true")
    return parser.parse_args()


def build_config(args: argparse.Namespace) -> TestConfig:
    return TestConfig(
        serial_port=args.serial_port,
        serial_baudrate=args.serial_baudrate,
        sleep_keyword=args.sleep_keyword,
        sleep_timeout=args.sleep_timeout,
        wake_delay=args.wake_delay,
        wifi_profile=args.wifi_profile,
        wifi_ssid=args.wifi_ssid,
        wifi_timeout=args.wifi_timeout,
        ssh_host=args.ssh_host,
        ssh_user=args.ssh_user,
        ssh_port=args.ssh_port,
        ssh_timeout=args.ssh_timeout,
        ping_target=args.ping_target,
        ping_count=args.ping_count,
        can_channel=args.can_channel,
        can_bitrate=args.can_bitrate,
        wake_arbitration_id=int(args.wake_arbitration_id, 0),
        wake_data_hex=args.wake_data_hex,
        cycles=args.cycles,
        cycle_pause=args.cycle_pause,
        continue_on_failure=not args.stop_on_failure,
        output_dir=Path(args.output_dir),
    )


def run_test(config: TestConfig) -> list[CycleResult]:
    config.output_dir.mkdir(parents=True, exist_ok=True)
    result_path = config.output_dir / "results.jsonl"
    serial_log_path = config.output_dir / "serial.log"

    watcher = SerialKeywordWatcher(config.serial_port, config.serial_baudrate, config.serial_timeout)
    can_sender = PcanWakeSender(config.can_channel, config.can_bitrate)
    wifi = WindowsWifiConnector(config.wifi_profile, config.wifi_ssid)
    ssh = SshPingRunner(config.ssh_host, config.ssh_user, config.ssh_port, config.ssh_timeout)

    results: list[CycleResult] = []
    serial_log = serial_log_path.open("a", encoding="utf-8")

    try:
        for cycle in range(1, config.cycles + 1):
            started = time.time()
            stage = "wait_sleep"
            message = ""
            sleep_marker = ""
            success = False

            try:
                sleep_marker = watcher.wait_for_keyword(config.sleep_keyword, config.sleep_timeout)
                serial_log.write(f"{datetime.now().isoformat(timespec='seconds')} cycle={cycle} sleep={sleep_marker}\n")
                serial_log.flush()

                stage = "send_wake"
                can_sender.send(config.wake_arbitration_id, config.wake_payload)

                stage = "wake_settle"
                time.sleep(config.wake_delay)

                stage = "wifi_connect"
                wifi.connect()
                wifi.wait_connected(config.wifi_timeout)

                stage = "ssh_ping"
                ping_output = ssh.run_ping(config.ping_target, config.ping_count)
                message = ping_output.splitlines()[-1] if ping_output else "ping succeeded"
                success = True
            except Exception as exc:
                message = str(exc)
                LOG.error("cycle %s failed at %s: %s", cycle, stage, exc)
                if not config.continue_on_failure:
                    raise
            finally:
                duration = time.time() - started
                result = CycleResult(
                    cycle=cycle,
                    success=success,
                    stage=stage,
                    message=message,
                    duration_seconds=round(duration, 2),
                    timestamp=datetime.now().isoformat(timespec="seconds"),
                    sleep_marker=sleep_marker,
                )
                results.append(result)
                with result_path.open("a", encoding="utf-8") as fp:
                    fp.write(json.dumps(asdict(result), ensure_ascii=False) + "\n")
                LOG.info(
                    "cycle %s/%s: %s (%s, %.2fs)",
                    cycle,
                    config.cycles,
                    "PASS" if success else "FAIL",
                    stage,
                    duration,
                )
            time.sleep(config.cycle_pause)
    finally:
        watcher.close()
        serial_log.close()

    return results


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%H:%M:%S",
    )
    args = parse_args()
    config = build_config(args)

    LOG.info("starting %s cycles", config.cycles)
    LOG.info("serial=%s wifi=%s ssh=%s@%s", config.serial_port, config.wifi_profile, config.ssh_user, config.ssh_host)

    results = run_test(config)
    passed = sum(1 for item in results if item.success)
    failed = len(results) - passed

    summary = {
        "total": len(results),
        "passed": passed,
        "failed": failed,
        "output_dir": str(config.output_dir),
    }
    (config.output_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    LOG.info("summary: %s", summary)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
