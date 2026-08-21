#!/usr/bin/env python3

import argparse
import datetime as dt
import json
import re
from pathlib import Path


BACKUP_NAME = re.compile(
    r"^scheduled-(staging|production)-(\d{8}T\d{6}Z)\.dump$"
)


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1 or parsed > 3660:
        raise argparse.ArgumentTypeError("retention values must be between 1 and 3660")
    return parsed


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--backup-directory", required=True)
    parser.add_argument("--environment", choices=("staging", "production"), required=True)
    parser.add_argument("--minimum-copies", dest="minimum_copies", type=positive_int, required=True)
    parser.add_argument("--daily-days", dest="daily_days", type=positive_int, required=True)
    parser.add_argument("--weekly-weeks", dest="weekly_weeks", type=positive_int, required=True)
    parser.add_argument("--monthly-months", dest="monthly_months", type=positive_int, required=True)
    parser.add_argument("--protected-backup", required=True)
    return parser.parse_args()


def scheduled_backups(backup_directory: Path, environment: str):
    backups = []
    for candidate in backup_directory.iterdir():
        match = BACKUP_NAME.fullmatch(candidate.name)
        if not match or match.group(1) != environment or candidate.is_symlink():
            continue
        resolved = candidate.resolve(strict=True)
        if resolved.parent != backup_directory or not resolved.is_file():
            continue
        created_at = dt.datetime.strptime(match.group(2), "%Y%m%dT%H%M%SZ").replace(
            tzinfo=dt.timezone.utc
        )
        backups.append((created_at, resolved))
    return sorted(backups, reverse=True)


def retention_set(backups, arguments: argparse.Namespace):
    now = dt.datetime.now(dt.timezone.utc)
    keep = {path for _, path in backups[: arguments.minimum_copies]}
    protected = arguments.protected_backup
    if BACKUP_NAME.fullmatch(protected):
        keep.update(path for _, path in backups if path.name == protected)

    daily_cutoff = now - dt.timedelta(days=arguments.daily_days)
    weekly_cutoff = now - dt.timedelta(weeks=arguments.weekly_weeks)
    monthly_cutoff = now - dt.timedelta(days=31 * arguments.monthly_months)
    daily_buckets = set()
    weekly_buckets = set()
    monthly_buckets = set()

    for created_at, path in backups:
        if created_at >= daily_cutoff and created_at.date() not in daily_buckets:
            daily_buckets.add(created_at.date())
            keep.add(path)
        iso_calendar = created_at.isocalendar()
        weekly_bucket = (iso_calendar.year, iso_calendar.week)
        if created_at >= weekly_cutoff and weekly_bucket not in weekly_buckets:
            weekly_buckets.add(weekly_bucket)
            keep.add(path)
        monthly_bucket = (created_at.year, created_at.month)
        if created_at >= monthly_cutoff and monthly_bucket not in monthly_buckets:
            monthly_buckets.add(monthly_bucket)
            keep.add(path)
    return keep


def remove_backup(backup_directory: Path, backup: Path) -> None:
    resolved = backup.resolve(strict=True)
    if resolved.parent != backup_directory or not BACKUP_NAME.fullmatch(resolved.name):
        raise RuntimeError("refusing unsafe backup cleanup target")
    resolved.unlink()
    checksum = backup_directory / f"{resolved.name}.sha256"
    if checksum.exists() and not checksum.is_symlink() and checksum.resolve().parent == backup_directory:
        checksum.unlink()


def main() -> None:
    arguments = parse_arguments()
    backup_directory = Path(arguments.backup_directory).resolve(strict=True)
    if backup_directory != Path("/root/netflix-database-backups"):
        raise RuntimeError("backup directory is not the dedicated managed directory")

    backups = scheduled_backups(backup_directory, arguments.environment)
    keep = retention_set(backups, arguments)
    removed = []
    for _, backup in backups:
        if backup not in keep:
            removed.append(backup.name)
            remove_backup(backup_directory, backup)

    print(json.dumps({"retained": len(keep), "removed": removed}, separators=(",", ":")))


if __name__ == "__main__":
    main()
