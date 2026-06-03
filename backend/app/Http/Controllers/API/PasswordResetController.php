<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\API\Concerns\ApiResponse;
use App\Http\Requests\API\ForgotPasswordRequest;
use App\Http\Requests\API\ResetPasswordRequest;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class PasswordResetController extends Controller
{
    use ApiResponse;

    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return $this->respondSuccess(null, 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
        }

        return $this->respondError('تعذر إرسال رابط إعادة التعيين. تأكد من صحة البريد الإلكتروني.', 400);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => bcrypt($password),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->respondSuccess(null, 'تم إعادة تعيين كلمة المرور بنجاح');
        }

        return $this->respondError(
            $status === Password::INVALID_TOKEN
                ? 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية'
                : 'فشلت عملية إعادة تعيين كلمة المرور',
            400
        );
    }
}
