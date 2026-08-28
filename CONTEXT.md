# Netflix Clone

Netflix Clone is a self-hosted streaming catalog with user-facing playback and
administrator-operated content and system management.

## Administration audit

**Admin Audit Event**:
An append-only record of one security-sensitive administrator operation and its outcome.
_Avoid_: Backend log, activity log

**Actor**:
The authenticated administrator who initiated an audited operation.
_Avoid_: Caller, operator ID supplied by the browser

**Action**:
The stable, namespaced kind of administrator operation that was attempted.
_Avoid_: Message, log text

**Target**:
The domain object or operational resource affected by an audited action.
_Avoid_: Payload, arbitrary object

**Outcome**:
Whether an audited action succeeded, was denied, or failed while being performed.
_Avoid_: Status message

**Correlation ID**:
A non-secret identifier connecting an Admin Audit Event with related diagnostics and requests.
_Avoid_: Session token, request payload

**Audit Metadata**:
A bounded, action-specific allowlist of non-secret context attached to an Admin Audit Event.
_Avoid_: Request body, before-and-after snapshot

**Authorization Denial**:
An Admin Audit Event for an authenticated request rejected before a protected target is disclosed.
It records the actor and action but deliberately omits target and metadata.
_Avoid_: Not-found event containing a protected target ID

## Media integrity

**Media Scan Run**:
A bounded, read-only evaluation of one published Content item or the complete published Catalog at a point in time.
_Avoid_: Repair job, media sync

**Media Finding**:
A stable-coded observation that a Media Resource Reference is missing, invalid, unsafe, duplicated, or inconsistent with its Content metadata.
_Avoid_: Backend log, raw ffprobe error

**Media Resource Reference**:
The catalog value that identifies the video or thumbnail expected for a Content item without exposing its resolved host path.
_Avoid_: Host path, uploaded binary

**Orphaned Media Resource**:
A supported media file inside an approved media root that is not referenced by any published Content item.
_Avoid_: Missing file, deleted Content

## Background operations

**Weekly Job Schedule**:
An administrator-owned recurring plan for one database backup or complete Media Scan Run on selected weekdays at one local time and time zone.
_Avoid_: Cron job, server timer

**Scheduled Run**:
One durable background operation created from a Weekly Job Schedule that is tracked independently from later changes to that schedule.
_Avoid_: Schedule execution, timer event

## Deployment operations

**Deployment Record**:
An integrity-protected summary of one environment's latest deployment attempt, including migration, health, rollback, and recovery outcomes.
_Avoid_: Deploy log, container status

**Deployment Trust State**:
Whether a Deployment Record is verified and current, verified but stale, unavailable, or rejected as tampered.
_Avoid_: Success flag, health status

**Peer Environment**:
A separately operated staging or production environment whose Deployment Record is explicitly approved for comparison.
_Avoid_: Remote server, arbitrary host

## QR device pairing

**Device Pairing Request**:
A short-lived request that connects one signed-out Target Device with one explicitly approving authenticated user, without carrying a reusable session, password, or account identity.
_Avoid_: QR login token, shared session

**Target Device**:
The signed-out browser or TV-like device that receives an independently revocable session only after one approved Device Pairing Request is consumed.
_Avoid_: Approver device, phone session

**Approver**:
The authenticated user who confirms or denies a Device Pairing Request after satisfying the recent-authentication boundary.
_Avoid_: QR scanner, automatic login

**Pairing Secret**:
A high-entropy, one-time bearer value used only to identify a Device Pairing Request at its permitted step. It is never persisted or recorded in an event.
_Avoid_: Session token, account identifier

**Pairing Outcome**:
The single terminal state of a Device Pairing Request: approved and consumed, denied, cancelled, or expired.
_Avoid_: Request status message
