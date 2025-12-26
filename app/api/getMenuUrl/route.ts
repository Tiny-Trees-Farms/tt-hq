import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Shared Supabase instance for this API
const getSupabaseInstance = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

// Helper function to convert public URL to optimized render URL
const getOptimizedImageUrl = (publicUrl: string, quality: number = 100, format: string = 'png') => {
    try {
        // Temporarily disable render endpoint to test 403 issue
        // TODO: Re-enable once we confirm the render endpoint works
        return publicUrl;
        
        // Convert to render endpoint
        const renderUrl = publicUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        
        // Use URL constructor to properly handle query parameters
        const url = new URL(renderUrl);
        url.searchParams.set('quality', quality.toString());
        url.searchParams.set('format', format);
        
        return url.toString();
    } catch (error) {
        console.error('Error creating optimized URL, falling back to public URL:', error);
        return publicUrl;
    }
};

// Get all menu information
export async function GET(request: Request) {
    const supabase = getSupabaseInstance();

    try {
        // Get URL for current_menu.png
        const { data: currentMenuData } = await supabase.storage
            .from('menus')
            .getPublicUrl('current_menu.png');

        // List all files in the menus bucket
        const { data: menuFiles, error } = await supabase.storage
            .from('menus')
            .list();

        if (error) {
            console.error('Error listing menu files:', error);
            return NextResponse.json(
                { error: 'Failed to list menu files' },
                { status: 500 }
            );
        }

        // Generate optimized URLs for all files
        const fileObjects = menuFiles ? menuFiles.map(item => ({
            name: item.name,
            url: getOptimizedImageUrl(
                supabase.storage.from('menus').getPublicUrl(item.name).data.publicUrl
            ),
            size: item.metadata?.size || 0,
            createdAt: item.created_at || null
        })) : [];

        // Add cache control headers
        const headers = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };

        return NextResponse.json({
            currentMenu: {
                url: getOptimizedImageUrl(currentMenuData.publicUrl)
            },
            menuFiles: fileObjects
        }, { headers });
    } catch (error) {
        console.error('Error in getMenuUrl API:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}