// useAuthInsert.js
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function useAuthInsert({ name, role, shouldInsert }) {
  useEffect(() => {
    if (!shouldInsert || !name || !role) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          const userId = session?.user?.id;
          if (!userId) return;

          const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();

          if (selectError && selectError.code !== 'PGRST116') {
            console.error('SELECT error:', selectError.message);
            return;
          }

          if (!existingUser) {
            const { error: insertError } = await supabase.from('users').insert({
              id: userId,
              name,
              role,
            });

            if (insertError) {
              console.error('Failed to insert user profile:', insertError.message);
            } else {
              console.log('✅ User profile inserted');
            }
          } else {
            console.log('User already exists, skipping insert');
          }
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [name, role, shouldInsert]);
}
