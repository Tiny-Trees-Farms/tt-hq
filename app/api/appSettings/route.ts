import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Shared Supabase instance for this API
const getSupabaseInstance = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

// GET /api/appSettings - Get app settings
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const settingKey = searchParams.get('key');

        const supabase = getSupabaseInstance();

        if (settingKey) {
            // Get specific setting
            const { data, error } = await supabase
                .from('app_settings')
                .select('setting_key, setting_value, description, updated_at')
                .eq('setting_key', settingKey)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return NextResponse.json(
                        { error: `Setting '${settingKey}' not found` },
                        { status: 404 }
                    );
                }
                throw error;
            }

            return NextResponse.json({
                key: data.setting_key,
                value: data.setting_value,
                description: data.description,
                updatedAt: data.updated_at
            });
        } else {
            // Get all settings
            const { data, error } = await supabase
                .from('app_settings')
                .select('setting_key, setting_value, description, updated_at')
                .order('setting_key');

            if (error) throw error;

            const settings = data.reduce((acc: any, setting: any) => {
                acc[setting.setting_key] = {
                    value: setting.setting_value,
                    description: setting.description,
                    updatedAt: setting.updated_at
                };
                return acc;
            }, {});

            return NextResponse.json({ settings });
        }
    } catch (error) {
        console.error('Error in appSettings GET:', error);
        return NextResponse.json(
            { error: 'Failed to fetch app settings' },
            { status: 500 }
        );
    }
}

// PUT /api/appSettings - Update app settings (employee only - protected by middleware)
export async function PUT(request: NextRequest) {
    try {
        const { settingKey, settingValue, description } = await request.json();

        if (!settingKey || settingValue === undefined) {
            return NextResponse.json(
                { error: 'settingKey and settingValue are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseInstance();

        // Update or insert the setting
        const { data, error } = await supabase
            .from('app_settings')
            .upsert({
                setting_key: settingKey,
                setting_value: settingValue,
                description: description || null
            }, {
                onConflict: 'setting_key'
            })
            .select('setting_key, setting_value, description, updated_at')
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            setting: {
                key: data.setting_key,
                value: data.setting_value,
                description: data.description,
                updatedAt: data.updated_at
            }
        });

    } catch (error: any) {
        console.error('Error in appSettings PUT:', error);
        
        return NextResponse.json(
            { error: 'Failed to update app settings' },
            { status: 500 }
        );
    }
} 