# LMS foundation

This is a Laravel monolith: session authentication, CSRF protection, policies, validation, and all routing stay in Laravel. Inertia delivers typed React page props. There is no separate API or client router. The frontend uses React, TypeScript, Tailwind 4, and locally owned Shadcn UI Button/Card components with Radix Slot and Lucide icons. The `emil-design-eng` skill informed keyboard focus, readable density, responsive layout, native instruction disclosures, and reduced-motion-aware press feedback.

## Installation status

The original checkout contained Laravel 12. Dependencies are now resolved to the requested Laravel 11.57.0, Inertia Laravel 2.0.28, and Reverb 1.12.0, with synchronized Composer and npm lockfiles. The React/TypeScript production build passes. Initial installation was blocked by network access; after access became available, Composer also blocked Laravel 11 because of security advisories. A one-time `--no-security-blocking` override was used for the local installation. No global or project security policy was disabled; this is not a security clearance for production deployment.

The local PHP 8.2 runtime has SQLite but lacks `pdo_pgsql`. PHP syntax checks, Pint, Composer manifest/lock validation, and the TypeScript/Vite production build pass. The foundation now includes classroom creation, assignment posting, and the draft/turn-in/grade/return workflow. See [the source comparison and workflow guide](open-source-comparison.md) for the design decisions and verification scope. Real-time connectivity, PostgreSQL constraints, and simultaneous database sessions still need target-environment verification. No production database was migrated.

Laravel 11 security support ended March 12, 2026, according to the [official support policy](https://laravel.com/docs/11.x/releases#support-policy). The manifest follows the requested version; a production deployment now requires a supported Laravel release or an explicit maintained support arrangement. Composer security checks remain enabled.

## Setup

Requirements: PHP 8.2+ with `pdo_pgsql`, PostgreSQL, Composer, and Node 22+. Enable `pdo_pgsql` in the PHP configuration used by both CLI and the web server. Use a dedicated PostgreSQL database and application user.

From `MyLaravelApp`, resolve dependencies in a network-enabled environment:

```powershell
composer install
npm.cmd ci
```

Copy `.env.example` to `.env` only for a new installation. Set `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` to the PostgreSQL database credentials. The existing `.env` was preserved. Generate an application key only for a new installation:

```powershell
php artisan key:generate
```

Generate independent Reverb public-key and secret values with this command, run it twice, and assign the outputs to `REVERB_APP_KEY` and `REVERB_APP_SECRET`. Keep the secret on the server; only the app key is included in `VITE_REVERB_APP_KEY`.

```powershell
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

Set `REVERB_HOST`, `REVERB_PORT`, and `REVERB_SCHEME` to the endpoint reachable by the browser and Laravel publisher. The example uses `localhost:8080` with HTTP for local development. Set `REVERB_ALLOWED_ORIGINS` to comma-separated allowed browser hostnames. Then:

```powershell
php artisan migrate
npm.cmd run build
php artisan test
```

For local data, set `LMS_DEMO_PASSWORD` in the current process environment to a password of at least 12 characters, then run:

```powershell
php artisan db:seed --class=LmsDemoSeeder
```

Sign in with `teacher@classwork.test` or `student@classwork.test` and the password you supplied. The seeder is restricted to local/testing, creates three assignments and an enrollment, and can be run again without duplicating them. It resets the two demo account passwords to the supplied value.

Start each process in its own terminal:

```powershell
php artisan serve
```

```powershell
npm.cmd run dev
```

```powershell
php artisan queue:work --tries=3
```

```powershell
php artisan reverb:start
```

Open the URL printed by `artisan serve`. Assignments are listed from the database; there are no hardcoded page fixtures. Leave `VITE_REVERB_APP_KEY` empty and use `BROADCAST_CONNECTION=null` if real-time delivery is intentionally disabled locally. The stream remains usable with its Refresh button.

## Files and contracts

| Block | Implementation |
| --- | --- |
| Users and auth tracking | `database/migrations/0001_01_01_000000_create_users_table.php`, additive `2026_10_27_000001_add_role_to_users_table.php` |
| Classrooms, enrollment, assignments, submissions | `database/migrations/2026_10_27_000002_create_lms_tables.php` |
| Relationships and enum casts | `app/Models/`, `app/Enums/` |
| Invite generation and collision retries | `Classroom::boot()`, `app/Actions/CreateClassroom.php` |
| Enrollment and draft file writes | `app/Actions/EnrollStudent.php`, `UploadSubmissionFile.php` |
| Ownership/state locking | `app/Policies/SubmissionPolicy.php` |
| Form validation | `app/Http/Requests/` |
| Stream and enrollment endpoints | `app/Http/Controllers/ClassroomStreamController.php`, `EnrollmentController.php` |
| Inertia bootstrapping | `app/Http/Middleware/HandleInertiaRequests.php`, `bootstrap/app.php`, `resources/views/app.blade.php`, `resources/js/app.tsx` |
| React stream and assignment rendering | `resources/js/Pages/Classroom/Stream.tsx`, `resources/js/components/classroom/assignment-card.tsx` |
| Shadcn UI source | `resources/js/components/ui/`, `components.json` |
| Real-time delivery | `app/Events/ClassroomStreamUpdated.php`, `app/Observers/AssignmentObserver.php`, `routes/channels.php`, `config/reverb.php`, `resources/js/lib/echo.ts` |
| Tests | `tests/Feature/LmsFoundationTest.php`, `LmsHttpTest.php` |

`GET /classrooms/{classroom}/stream` returns:

```typescript
{
    classroom: {
        id: number;
        name: string;
        section: string | null;
        teacher: { id: number; name: string };
        students_count: number;
        invite_code: string | null;
    };
    streamItems: {
        data: StreamItem[];
        next_page_url: string | null;
        prev_page_url: string | null;
    };
}
```

Only the owning teacher receives the invitation code. Only the owner, enrolled students, or administrators can read a classroom. The stream excludes grades, averages, emails, student file keys, and full rosters. Assignment authors are eager loaded with only IDs and names. `author_id` was added beyond the requested fields because authorship cannot be represented reliably by a classroom's current teacher.

`POST /classrooms/join` accepts `invite_code`, trims and uppercases it, and requires exactly seven ASCII alphanumeric characters. Only students can join. Unknown codes become a field validation error. Ten attempts per user per minute are allowed. The composite enrollment primary key and `insertOrIgnore` produce PostgreSQL `ON CONFLICT DO NOTHING`, including when two requests arrive together.

`POST /submissions/{submission}/file` accepts a multipart `file` up to 20 MiB from the explicit MIME allowlist. The policy requires an enrolled student who owns the submission and a status of **draft**. Submitted, graded, and returned submissions remain locked. The upload action rereads the row using `SELECT FOR UPDATE` and reauthorizes inside the transaction, protecting against stale draft objects. File names are metadata; storage keys are generated by Laravel on the private local disk. `file_url` holds that object key, not a public URL. `GET /submissions/{submission}/file` reauthorizes access and serves a private attachment; teachers cannot download drafts.

## Data integrity and concurrency

- The original users migration is retained and role is added separately so an existing skeleton database can migrate safely. Authentication columns, verification timestamps, remember tokens, and timestamps remain available. Roles are excluded from public mass assignment.
- Dependent enrollment, assignment, and submission records cascade on classroom deletion. Teacher and author foreign keys restrict user deletion to protect authorship; transfer or remove their authored content explicitly first. Student deletion cascades their memberships and submissions.
- Assignment/student submission pairs are unique. Reverse enrollment lookups, classroom stream ordering, due-date lookup, and status filters have supporting indexes. Cursor pagination reads 20 assignments without offset scans or a total-count query.
- PostgreSQL checks enforce invitation format, assignment point bounds, cached-average bounds, nonnegative grades, grade metadata for the graded state, and paired file metadata. SQLite tests do not prove those PostgreSQL-only checks.
- Use `CreateClassroom::handle()` for all classroom creation paths. The model boot hook generates the code; the unique database constraint handles competing inserts; the action retries collisions in separate transactions/savepoints. An application-level existence query alone cannot guarantee uniqueness.
- `GradeSubmission` validates grades against assignment points and updates `class_average` under an assignment row lock in the same transaction. Returned grades remain included. The average is exposed only to the classroom teacher on the assignment review page. Future deletion/reassignment flows must maintain this cache; the current UI does not expose those mutations.
- Future submission state transitions and grade updates must acquire the same submission row lock before checking/changing state. A policy check by itself is not concurrency control. Do not introduce unguarded bulk updates into student-facing paths.
- Assignment model saves/deletes dispatch a private-channel invalidation event after the transaction commits. Query-builder bulk writes bypass Eloquent observers and must explicitly emit invalidations. Clients coalesce notifications into a single refresh prompt, avoiding a request per broadcast. Private-channel permission is checked at subscription time; use disconnect/re-authentication on membership revocation if immediate removal of established subscriptions is required. Broadcasts contain only a classroom ID.
- Filesystem writes are outside PostgreSQL transactions. Failed uploads clean up their newly stored file; old files remain unreferenced after successful replacement. A scheduled retention cleanup and shared private storage are deployment responsibilities. Account and classroom deletion also require retention cleanup of unreferenced objects.

## Target-environment verification

The default PHPUnit connection is disposable in-memory SQLite. To exercise PostgreSQL, create a dedicated empty test database and set `DB_CONNECTION=pgsql`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in the test process environment before running the suite. Never point `RefreshDatabase` at a database whose data must be preserved.

Run `npm.cmd run build`, `php artisan test`, and `php vendor/bin/pint --test` after dependencies resolve. Verify a teacher's stream and invitation, a student's join, an outsider's 403, and a private Echo subscription using two browser sessions. Test simultaneous joins and file-upload/state-transition requests against separate PostgreSQL connections before making a concurrency capacity claim.

For multiple application instances, configure shared Redis cache/session/queue stores and private file storage. Set `REVERB_SCALING_ENABLED=true` with shared Redis for multiple Reverb instances. Use HTTPS/WSS, a process supervisor for queue/Reverb workers, appropriate upload limits, and production secrets. Rebuild Vite assets when changing public Reverb configuration. This is a foundation for high concurrency; throughput still depends on deployment sizing and measured load tests.

References: [Laravel authorization](https://laravel.com/docs/11.x/authorization), [Laravel pessimistic locking](https://laravel.com/docs/11.x/queries#pessimistic-locking), [Laravel Reverb](https://laravel.com/docs/11.x/reverb), [Inertia 2 server setup](https://inertiajs.com/docs/v2/installation/server-side-setup).
