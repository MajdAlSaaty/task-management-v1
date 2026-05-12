<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('user_id') 
            ->constrained()        
            ->onDelete('cascade'); 

            $table->string('title', 255); 
            $table->text('description')->nullable(); 
            $table->tinyInteger('priority')->default(3); // 1=Highest, 5=Lowest
            
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])
                  ->default('pending');
            $table->integer('duration_minutes'); 
            $table->dateTime('deadline');
            $table->unsignedInteger('reminder_minutes')->nullable();
            $table->timestamps();
            
            
            $table->index(['user_id', 'deadline']);
            $table->index(['user_id', 'status', 'priority']);
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
