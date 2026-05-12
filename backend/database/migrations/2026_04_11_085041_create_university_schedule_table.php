<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stores recurring university classes or other blocked times.
     */
    public function up(): void
    {
        Schema::create('university_schedule', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title', 255); 
            $table->enum('day_of_week', [
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
                'Friday', 'Saturday', 'Sunday'
            ]);
            $table->time('start_time');
            $table->time('end_time');
            $table->date('valid_from');   // First day this schedule applies
            $table->date('valid_until')->nullable(); // Last day (null = forever)
            $table->timestamps();

            $table->index(['user_id', 'day_of_week', 'valid_from']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('university_schedule');
    }
};
