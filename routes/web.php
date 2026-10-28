<?php

declare(strict_types=1);

use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\ClassroomIndexController;
use App\Http\Controllers\ClassroomStreamController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\SubmissionFileController;
use App\Http\Controllers\SubmissionWorkflowController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [SessionController::class, 'create'])->name('login');
    Route::post('/login', [SessionController::class, 'store'])->middleware('throttle:login');
});

Route::middleware('auth')->group(function (): void {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');
    Route::get('/portal/{section}', fn (string $section) => Inertia::render('Portal/Section', ['section' => $section]))->whereIn('section', ['profile', 'registration', 'attendance', 'exams', 'library', 'finance'])->name('portal.section');
    Route::get('/', [ClassroomIndexController::class, 'index'])->name('classrooms.index');
    Route::post('/logout', [SessionController::class, 'destroy'])->name('logout');
    Route::post('/classrooms', [ClassroomController::class, 'store'])->middleware('throttle:30,1')->name('classrooms.store');
    Route::get('/classrooms/{classroom}/stream', [ClassroomStreamController::class, 'index'])->name('classrooms.stream');
    Route::post('/classrooms/join', [EnrollmentController::class, 'join'])->middleware('throttle:enrollment')->name('classrooms.join');
    Route::post('/classrooms/{classroom}/assignments', [AssignmentController::class, 'store'])->middleware('throttle:30,1')->name('assignments.store');
    Route::get('/assignments/{assignment}', [AssignmentController::class, 'show'])->name('assignments.show');
    Route::post('/assignments/{assignment}/draft', [SubmissionWorkflowController::class, 'draft'])->middleware('throttle:30,1')->name('submissions.draft');
    Route::post('/submissions/{submission}/submit', [SubmissionWorkflowController::class, 'submit'])->middleware('throttle:30,1')->name('submissions.submit');
    Route::patch('/submissions/{submission}/grade', [SubmissionWorkflowController::class, 'grade'])->middleware('throttle:60,1')->name('submissions.grade');
    Route::post('/submissions/{submission}/return', [SubmissionWorkflowController::class, 'returnGrade'])->middleware('throttle:60,1')->name('submissions.return');
    Route::get('/submissions/{submission}/file', [SubmissionFileController::class, 'download'])->name('submissions.download');
    Route::post('/submissions/{submission}/file', [SubmissionFileController::class, 'store'])->middleware('throttle:30,1')->name('submissions.file');
});
