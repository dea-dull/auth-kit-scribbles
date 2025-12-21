📌 NOTES FOR FUTURE IMPLEMENTATION
1. Create the UserSettingsTable

This table will store:

user_id (PK)

plan_level (free, plus, pro…)

max_storage_mb

max_file_size_mb

max_share_link_days (default 7)

max_shares_per_month

used_shares_this_month

allowed_file_types

allowed_trash_recovery_days

GSIs to add
GSI	Partition Key	Purpose
UserIdIndex	user_id	Fast access to settings from Lambdas
PlanLevelIndex	plan_level	Internal analytics, plan migrations
Future Lambda Updates

Any function handling storage, upload, share links, or limits will need:

Environment:
USER_SETTINGS_TABLE: !Ref UserSettingsTable


and permissions:

- dynamodb:GetItem
- dynamodb:UpdateItem

2. Distinguish tables: UserInfo vs UserSettings

Don't mix business logic into one place.

UserInfoTable

Stores:

basic profile

name

email

account status

creation date

UserSettingsTable

Stores:

plan rules

usage limits

file limits

share link limits

feature flags

Why split?

Less clutter

Faster performing queries

Easier pricing upgrades

More scalable later

3. Enforce per-plan rules everywhere

Once plans exist, update Lambdas to check:

Drive Upload

max file size

allowed file types

user storage quota

enforce no override on expiry > plan max

Share Link Generation

max expiry days allowed for that plan

monthly share quota

track usage (increment used_shares_this_month)

Trash System

retain deleted files for allowed_trash_recovery_days

free users may have 3–7 days

paid users get longer recovery

4. Future TrashTable

Add when implementing the trash feature.

Fields:

user_id (PK)

file_id (SK)

trashed_at (number)

expires_at (TTL)

Add GSI if you need:

UserTrashIndex (user_id → list trashed files)

5. Future indexing for large-scale features
For drive files:

GSI for listing by folder

GSI for recently modified

GSI for searching by name

For share links:

GSI on user_id

So you can show “Your shared links” page

6. Deferred Lambdas (add later)
a) MonthlyResetFunction

Resets used_shares_this_month to 0 on the 1st of each month.

b) CleanupTrashedFilesFunction

Triggered by TrashTable TTL deletions (optional):

Log deletions

Remove extra metadata

Free S3 storage

c) PlanUpgradeFunction

On upgrading plan:

recalc limits

update UserSettingsTable

apply new quotas immediately

7. Pre-sign URL logic upgrade

When you implement user plans:

user can choose expiry but max = plan limit

backend must clamp the expiry

never trust frontend expiry

backend must check monthly shared link quota

store each share link in ShareTable with metadata

add ability to invalidate/disable a link early

8. S3 storage tracking

You will eventually need:

table or field storing “current storage used (MB)”

update on upload/delete

enforce max_storage_mb

You can calculate size using:

HeadObjectCommand

9. Write this once the tables are created

In your template:

add new table resources

add IAM policies to relevant Lambdas

add environment variables

add triggers for monthly cleanup

10. General rule

Frontend NEVER decides limits. Backend enforces everything.