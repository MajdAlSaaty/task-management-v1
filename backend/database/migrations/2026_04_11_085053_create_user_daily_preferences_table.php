<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stores each user's preferred study times for each day of the week.
     */
    public function up(): void
    {
        Schema::create('user_daily_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('day_of_week', [
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
                'Friday', 'Saturday', 'Sunday'
            ]);
            $table->time('preferred_start_time'); 
            $table->time('preferred_end_time');   
            $table->time('break_start_time')->nullable(); 
            $table->time('break_end_time')->nullable();  
            $table->timestamps();
            
            
            $table->unique(['user_id', 'day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_daily_preferences');
    }
};