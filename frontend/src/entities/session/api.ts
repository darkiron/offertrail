import { supabase } from '../../lib/supabase';
import { finalizePasswordRecovery } from '../../utils/passwordRecovery';
import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from './model';

export const sessionApi = {
  requestPasswordReset: async (email: string): Promise<void> => {
    const { email: validEmail } = passwordResetRequestSchema.parse({ email });
    const { error } = await supabase.auth.resetPasswordForEmail(validEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  confirmPasswordReset: async (password: string): Promise<void> => {
    const { password: validPassword } = passwordResetConfirmSchema.parse({
      password,
    });
    await finalizePasswordRecovery(supabase.auth, validPassword);
  },
};
