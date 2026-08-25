import { http as axiosInstance } from '@shared/api/http';
import { supabase } from '../../lib/supabase';
import {
  passwordChangeSchema,
  profileSchema,
  profileUpdateSchema,
  type ProfileUpdate,
} from './model';

export const profileApi = {
  update: async (payload: ProfileUpdate) => {
    const validPayload = profileUpdateSchema.parse(payload);
    return profileSchema.parse(
      (await axiosInstance.patch('/auth/me', validPayload)).data,
    );
  },

  changePassword: async (password: string): Promise<void> => {
    const { password: validPassword } = passwordChangeSchema.parse({
      password,
    });
    const { error } = await supabase.auth.updateUser({
      password: validPassword,
    });
    if (error) throw error;
  },
};
