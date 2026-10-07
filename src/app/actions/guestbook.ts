'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { moderateGuestbookMessage } from '@/lib/guestbook-moderation';
import { getAuthUser } from '@/lib/openauth';
import { createAdminClient } from '@/utils/supabase/admin';
import { isRateLimited } from '@/lib/api-rate-limit';

export async function getMessages() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('guestbook')
        .select('id,user_id,user_name,user_avatar,message,created_at')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) return { error: error.message };
    return { data };
}

export async function postMessage(message: string) {
    const user = await getAuthUser();

    if (!user) return { error: 'You must be logged in to post.' };
    if (typeof message !== 'string') return { error: 'Invalid message.' };
    const supabase = createAdminClient();

    const normalizedMessage = message.trim();
    if (!normalizedMessage) return { error: 'Message cannot be empty.' };
    if (normalizedMessage.length > 1000) return { error: 'Message must be 1000 characters or fewer.' };
    if (isRateLimited(new Headers({ 'cf-connecting-ip': user.id }), 'guestbook-post', 5, 10 * 60 * 1000)) {
        return { error: 'Please wait before posting another message.' };
    }

    const moderation = await moderateGuestbookMessage(normalizedMessage);
    if (moderation.blocked) {
        return {
            error: `Message blocked by safety policy (${moderation.reasons.join(', ')}).`
        };
    }

    const displayName = (user.user_metadata.full_name || user.user_metadata.user_name || user.email?.split('@')[0] || 'Anonymous').trim().replace(/[\r\n]+/g, ' ').slice(0, 80) || 'Anonymous';
    let avatarUrl = user.user_metadata.avatar_url || '';
    try {
        if (new URL(avatarUrl).protocol !== 'https:') avatarUrl = '';
    } catch { avatarUrl = ''; }

    const { error } = await supabase
        .from('guestbook')
        .insert({
            message: normalizedMessage,
            user_id: user.id,
            user_name: displayName,
            user_avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=18181b&color=fff`
        });

    if (error) return { error: error.message };
    revalidatePath('/guestbook');
    return { success: true };
}

export async function updateMessage(id: string, message: string) {
    const user = await getAuthUser();

    if (!user) return { error: 'Unauthorized' };
    if (typeof id !== 'string' || id.length > 64 || typeof message !== 'string') return { error: 'Invalid request.' };
    const supabase = createAdminClient();

    const normalizedMessage = message.trim();
    if (!normalizedMessage) return { error: 'Message cannot be empty.' };
    if (normalizedMessage.length > 1000) return { error: 'Message must be 1000 characters or fewer.' };
    if (isRateLimited(new Headers({ 'cf-connecting-ip': user.id }), 'guestbook-update', 5, 10 * 60 * 1000)) {
        return { error: 'Please wait before updating another message.' };
    }

    const moderation = await moderateGuestbookMessage(normalizedMessage);
    if (moderation.blocked) {
        return {
            error: `Message blocked by safety policy (${moderation.reasons.join(', ')}).`
        };
    }

    const { error } = await supabase
        .from('guestbook')
        .update({ message: normalizedMessage, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/guestbook');
    return { success: true };
}

export async function deleteMessage(id: string) {
    const user = await getAuthUser();

    if (!user) return { error: 'Unauthorized' };
    if (typeof id !== 'string' || id.length > 64) return { error: 'Invalid request.' };
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/guestbook');
    return { success: true };
}

export async function signInWithGithub() {
    return { url: '/auth/start?provider=github&next=%2Fguestbook', error: undefined };
}
