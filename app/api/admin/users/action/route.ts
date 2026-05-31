import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication & Role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    // 2. Parse request payload
    const { targetUserId, action } = await request.json();
    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Protect against self-demotion
    if (targetUserId === user.id && action === 'toggle_admin') {
      return NextResponse.json({ error: 'Cannot revoke your own admin rights' }, { status: 400 });
    }

    // Fetch target user details
    const { data: targetUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // 3. Perform actions
    if (action === 'toggle_availability') {
      const { error: updateErr } = await supabase
        .from('users')
        .update({ availability: !targetUser.availability })
        .eq('id', targetUserId);

      if (updateErr) throw updateErr;
      return NextResponse.json({ success: true, newAvailability: !targetUser.availability });
    }

    if (action === 'toggle_admin') {
      const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
      const { error: updateErr } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUserId);

      if (updateErr) throw updateErr;
      return NextResponse.json({ success: true, newRole });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin user action error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
