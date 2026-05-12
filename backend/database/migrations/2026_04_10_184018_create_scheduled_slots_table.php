<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stores actual time blocks assigned to tasks.
     */
    public function up(): void
    {
        Schema::create('scheduled_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->dateTime('start_time'); // When the study session begins
            $table->dateTime('end_time');   // When it ends
            $table->enum('status', ['scheduled', 'completed', 'missed', 'cancelled'])
                  ->default('scheduled');
            $table->timestamps();
            
            // This index helps quickly check for overlapping slots
            $table->index(['user_id', 'start_time', 'end_time']);
            $table->index(['task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_slots');
    }
};
