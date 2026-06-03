<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\API\Concerns\ApiResponse;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    use ApiResponse;

    public function verify(Request $request, $id, $hash): JsonResponse|RedirectResponse
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        $user = User::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return redirect($frontendUrl . '/verify-email?error=invalid');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect($frontendUrl . '/verify-email?verified=1');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect($frontendUrl . '/verify-email?verified=1');
    }

    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->respondSuccess(['verified' => true], 'البريد الإلكتروني مُفعّل بالفعل');
        }

        $user->sendEmailVerificationNotification();

        return $this->respondSuccess(null, 'تم إعادة إرسال رابط التفعيل');
    }
}
