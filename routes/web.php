<?php

declare(strict_types=1);

use App\Http\Controllers\ClassroomIndexController;
use App\Http\Controllers\ClassroomStreamController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\SubmissionFileController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [SessionController::class, 'create'])->name('login');
    Route::post('/login', [SessionController::class, 'store'])->middleware('throttle:login');
});

Route::middleware('auth')->group(function (): void {
    Route::get('/', [ClassroomIndexController::class, 'index'])->name('classrooms.index');
    Route::post('/logout', [SessionController::class, 'destroy'])->name('logout');
    Route::get('/classrooms/{classroom}/stream', [ClassroomStreamController::class, 'index'])->name('classrooms.stream');
    Route::post('/classrooms/join', [EnrollmentController::class, 'join'])->middleware('throttle:enrollment')->name('classrooms.join');
    Route::post('/submissions/{submission}/file', [SubmissionFileController::class, 'store'])->middleware('throttle:30,1')->name('submissions.file');
});
