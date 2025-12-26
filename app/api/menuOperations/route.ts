import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Shared Supabase instance for this API
const getSupabaseInstance = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

// Handle POST requests for menu operations
export async function POST(request: NextRequest) {
    const supabase = getSupabaseInstance();
    
    try {
        const formData = await request.formData();
        const operation = formData.get('operation') as string;
        
        switch (operation) {
            case 'upload': {
                const file = formData.get('file') as File;
                const fileName = formData.get('fileName') as string;
                
                if (!file || !fileName) {
                    return NextResponse.json(
                        { error: 'Missing file or filename' },
                        { status: 400 }
                    );
                }
                
                // Check file size (5MB limit)
                if (file.size > 5 * 1024 * 1024) {
                    return NextResponse.json(
                        { error: 'File size too large. Please upload a file smaller than 5MB.' },
                        { status: 400 }
                    );
                }
                
                // Ensure filename has .png extension
                const finalFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
                
                // Upload file to Supabase storage
                const { data, error: uploadError } = await supabase.storage
                    .from('menus')
                    .upload(finalFileName, file, {
                        cacheControl: '3600',
                        upsert: true
                    });
                    
                if (uploadError) {
                    return NextResponse.json(
                        { error: `Upload error: ${uploadError.message}` },
                        { status: 500 }
                    );
                }
                
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('menus')
                    .getPublicUrl(finalFileName);
                    
                // Add revalidation
                await revalidatePath('/dashboard');
                await revalidatePath('/order');
                return NextResponse.json({
                    success: true,
                    fileName: finalFileName,
                    url: publicUrl
                });
            }
            
            case 'delete': {
                const fileName = formData.get('fileName') as string;
                
                if (!fileName) {
                    return NextResponse.json(
                        { error: 'Missing filename' },
                        { status: 400 }
                    );
                }
                
                if (fileName === 'current_menu.png') {
                    return NextResponse.json(
                        { error: 'Cannot delete the current menu' },
                        { status: 400 }
                    );
                }
                
                const { error } = await supabase.storage
                    .from('menus')
                    .remove([fileName]);
                    
                if (error) {
                    return NextResponse.json(
                        { error: `Failed to delete menu: ${error.message}` },
                        { status: 500 }
                    );
                }
                
                // Add revalidation
                await revalidatePath('/dashboard');
                await revalidatePath('/order');
                return NextResponse.json({
                    success: true,
                    fileName
                });
            }
            
            case 'setCurrent': {
                const fileName = formData.get('fileName') as string;
                
                if (!fileName) {
                    return NextResponse.json(
                        { error: 'Missing filename' },
                        { status: 400 }
                    );
                }
                
                // Download the selected file
                const { data: fileData, error: fileError } = await supabase.storage
                    .from('menus')
                    .download(fileName);
                    
                if (fileError || !fileData) {
                    return NextResponse.json(
                        { error: 'Failed to download the selected menu' },
                        { status: 500 }
                    );
                }
                
                // Upload as current_menu.png
                const { error: uploadError } = await supabase.storage
                    .from('menus')
                    .upload('current_menu.png', fileData, {
                        cacheControl: '3600',
                        upsert: true
                    });
                    
                if (uploadError) {
                    return NextResponse.json(
                        { error: `Failed to set as current menu: ${uploadError.message}` },
                        { status: 500 }
                    );
                }
                
                // Get the updated URL
                const { data: { publicUrl } } = supabase.storage
                    .from('menus')
                    .getPublicUrl('current_menu.png');
                    
                // Add revalidation
                await revalidatePath('/dashboard');
                await revalidatePath('/order');
                return NextResponse.json({
                    success: true,
                    url: publicUrl
                });
            }
            
            default:
                return NextResponse.json(
                    { error: 'Invalid operation' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in menu operations API:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 