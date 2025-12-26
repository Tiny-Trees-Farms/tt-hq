"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, FileText } from "lucide-react";

interface DailyMenuInfoText {
    businessHours: string;
    orderCutoff: string;
    orderMinimum: string;
    paymentMethod: string;
}

export default function MenuSection() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [menuUrl, setMenuUrl] = useState<string>('');
    const [menuFiles, setMenuFiles] = useState<{name: string, url: string, createdAt?: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [backgroundColors, setBackgroundColors] = useState<{topColor: string, bottomColor: string}>({
        topColor: '#000000',
        bottomColor: '#1a1a1a'
    });
    const [isSavingColors, setIsSavingColors] = useState(false);
    const [infoText, setInfoText] = useState<DailyMenuInfoText>({
        businessHours: "Mon.-Sat. 12pm - 7pm",
        orderCutoff: "*[7:00pm order cutoff for same-day delivery]*",
        orderMinimum: "$95 order minimum",
        paymentMethod: "- CASH ONLY -"
    });
    const [isSavingInfoText, setIsSavingInfoText] = useState(false);

    const fetchBackgroundColors = useCallback(async () => {
        try {
            const response = await fetch('/api/appSettings?key=dailymenu_background_colors');
            if (response.ok) {
                const data = await response.json();
                setBackgroundColors(data.value);
            }
        } catch (error) {
            console.error("Error fetching background colors:", error);
        }
    }, []);

    const fetchInfoText = useCallback(async () => {
        try {
            const response = await fetch('/api/appSettings?key=dailymenu_info_text');
            if (response.ok) {
                const data = await response.json();
                setInfoText(data.value);
            }
        } catch (error) {
            console.error("Error fetching info text:", error);
        }
    }, []);

    const fetchMenuData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch menu data, background colors, and info text in parallel
            const [menuResponse] = await Promise.all([
                fetch(`/api/getMenuUrl?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: {
                        'Pragma': 'no-cache',
                        'Cache-Control': 'no-cache'
                    }
                }),
                fetchBackgroundColors(),
                fetchInfoText()
            ]);
            
            if (!menuResponse.ok) {
                throw new Error(`HTTP error! status: ${menuResponse.status}`);
            }
            
            const data = await menuResponse.json();
            setMenuUrl(data.currentMenu.url);
            setMenuFiles(data.menuFiles || []);
        } catch (error) {
            console.error("There was a problem fetching data:", error);
            setError("Failed to load data. Please try again later.");
            toast.error("Error", {
                description: "Failed to load menu data. Please try again later."
            });
        } finally {
            setIsLoading(false);
        }
    }, [fetchBackgroundColors, fetchInfoText]);

    useEffect(() => {
        fetchMenuData();
    }, [fetchMenuData]);

    const handleFileUpload = async () => {
        if (!selectedFile || !fileName.trim()) {
            toast.error("Error", {
                description: "Please select a file and provide a filename."
            });
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            
            // Check file size (e.g., 5MB limit)
            if (selectedFile.size > 5 * 1024 * 1024) {
                throw new Error('File size too large. Please upload a file smaller than 5MB.');
            }

            // Create FormData for the API request
            const formData = new FormData();
            formData.append('operation', 'upload');
            formData.append('file', selectedFile);
            formData.append('fileName', fileName);
            
            // Send request to API
            const response = await fetch('/api/menuOperations', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }
            
            const result = await response.json();
            
            // Force a fresh fetch of menu data
            await fetchMenuData();
            
            // Reset form
            setSelectedFile(null);
            setFileName('');
            
            toast.success("Upload Successful", {
                description: `Menu image "${result.fileName}" has been uploaded.`,
            });
            
        } catch (error) {
            console.error("Error in upload process:", error);
            setError(error instanceof Error ? error.message : "Failed to upload menu. Please try again.");
            toast.error("Upload Failed", {
                description: error instanceof Error ? error.message : "Failed to upload menu. Please try again."
            });
        } finally {
            setIsUploading(false);
        }
    };

    const setAsCurrentMenu = async (fileName: string) => {
        try {
            setIsLoading(true);
            
            // Create FormData for the API request
            const formData = new FormData();
            formData.append('operation', 'setCurrent');
            formData.append('fileName', fileName);
            
            // Send request to API
            const response = await fetch('/api/menuOperations', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to set as current menu');
            }
            
            const result = await response.json();
            
            // Update URL
            setMenuUrl(result.url);
            
            // Refresh the file list to ensure the UI is updated
            await fetchMenuData();
            
            toast.success("Current Menu Updated", {
                description: `"${fileName}" is now set as the current menu.`
            });
            
        } catch (error) {
            console.error("Error setting current menu:", error);
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to set current menu."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteMenu = async (fileName: string) => {
        if (fileName === 'current_menu.png') {
            toast.error("Cannot Delete", {
                description: "You cannot delete the current menu. Please upload a replacement first."
            });
            return;
        }
        
        try {
            setIsLoading(true);
            
            // Create FormData for the API request
            const formData = new FormData();
            formData.append('operation', 'delete');
            formData.append('fileName', fileName);
            
            // Send request to API
            const response = await fetch('/api/menuOperations', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete menu');
            }
            
            // Refresh the file list
            await fetchMenuData();
            
            toast.success("Menu Deleted", {
                description: `"${fileName}" has been deleted.`
            });
            
        } catch (error) {
            console.error("Error deleting menu:", error);
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to delete menu."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveBackgroundColors = async () => {
        try {
            setIsSavingColors(true);
            
            const response = await fetch('/api/appSettings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settingKey: 'dailymenu_background_colors',
                    settingValue: backgroundColors,
                    description: 'Background colors for the daily menu page - top right to bottom left diagonal split'
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save background colors');
            }
            
            toast.success("Background Colors Updated", {
                description: "The daily menu background colors have been saved successfully."
            });
            
        } catch (error) {
            console.error("Error saving background colors:", error);
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to save background colors."
            });
        } finally {
            setIsSavingColors(false);
        }
    };

    const setMostRecentAsCurrent = async () => {
        // Find the most recently uploaded file (excluding current_menu.png)
        const recentFiles = menuFiles
            .filter(file => file.name !== 'current_menu.png')
            .sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

        if (recentFiles.length === 0) {
            toast.error("No Files Available", {
                description: "No uploaded menu files found to set as current."
            });
            return;
        }

        const mostRecent = recentFiles[0];
        await setAsCurrentMenu(mostRecent.name);
    };

    const saveInfoText = async () => {
        try {
            setIsSavingInfoText(true);
            
            const response = await fetch('/api/appSettings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settingKey: 'dailymenu_info_text',
                    settingValue: infoText,
                    description: 'Editable text content for the daily menu page information section'
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save info text');
            }
            
            toast.success("Info Text Updated", {
                description: "The daily menu information text has been saved successfully."
            });
            
        } catch (error) {
            console.error("Error saving info text:", error);
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to save info text."
            });
        } finally {
            setIsSavingInfoText(false);
        }
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-zinc-800/50 text-zinc-100">
                    <TabsTrigger 
                        value="upload"
                        className="data-[state=active]:bg-zinc-700/50 data-[state=active]:text-zinc-100"
                    >
                        Upload Menu
                    </TabsTrigger>
                    <TabsTrigger 
                        value="manage"
                        className="data-[state=active]:bg-zinc-700/50 data-[state=active]:text-zinc-100"
                    >
                        Manage Menus
                    </TabsTrigger>
                    <TabsTrigger 
                        value="background"
                        className="data-[state=active]:bg-zinc-700/50 data-[state=active]:text-zinc-100"
                    >
                        <Palette className="h-4 w-4 mr-1" />
                        Background
                    </TabsTrigger>
                    <TabsTrigger 
                        value="info"
                        className="data-[state=active]:bg-zinc-700/50 data-[state=active]:text-zinc-100"
                    >
                        <FileText className="h-4 w-4 mr-1" />
                        Info
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="mt-6">
                    <div className="max-w-2xl mx-auto">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-zinc-100">Upload Menu Image</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Upload a new menu image to the Supabase storage bucket. Images must be PNG format and less than 5MB.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fileName" className="text-zinc-100">Filename</Label>
                                    <Input
                                        id="fileName"
                                        placeholder="Enter a filename (e.g., menu_spring_2023)"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        disabled={isUploading}
                                        className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
                                    />
                                    <p className="text-xs text-zinc-400">
                                        The .png extension will be added automatically if not included.
                                    </p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="menuFile" className="text-zinc-100">Menu Image (PNG)</Label>
                                    <Input
                                        id="menuFile"
                                        type="file"
                                        accept="image/png"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        disabled={isUploading}
                                        className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
                                    />
                                </div>
                                
                                {selectedFile && (
                                    <div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
                                        <p className="text-sm font-medium text-zinc-100">Selected file:</p>
                                        <p className="text-sm text-zinc-400">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    onClick={handleFileUpload}
                                    disabled={!selectedFile || !fileName || isUploading}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    {isUploading ? 'Uploading...' : 'Upload Menu'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="manage" className="mt-6">
                    <div className="max-w-3xl mx-auto">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-zinc-100">Current Menu</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    This is the menu currently displayed to customers.
                                </CardDescription>
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={setMostRecentAsCurrent}
                                        disabled={isLoading}
                                        className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700"
                                    >
                                        Set Most Recent as Current
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                {isLoading ? (
                                    <div className="text-center p-8 text-zinc-400">Loading current menu...</div>
                                ) : menuUrl ? (
                                    <Image 
                                        src={`${menuUrl}?t=${Date.now()}`}
                                        alt="Current Menu"
                                        width={400}
                                        height={560}
                                        className="rounded-md shadow-lg max-h-[560px] w-auto object-contain"
                                    />
                                ) : (
                                    <div className="text-zinc-500 text-center p-8">
                                        No current menu available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-4 text-zinc-100">All Uploaded Menus</h2>
                            {isLoading ? (
                                <div className="text-center p-8 text-zinc-400">Loading menus...</div>
                            ) : menuFiles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {menuFiles.map((file) => (
                                        <Card key={file.name} className="overflow-hidden bg-zinc-900/50 border-zinc-800">
                                            <div className="aspect-[3/4] relative max-h-[400px]">
                                                <Image
                                                    src={file.url}
                                                    alt={file.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <CardFooter className="flex flex-col items-start space-y-2 pt-4">
                                                <p className="text-sm font-medium text-zinc-100 truncate w-full">{file.name}</p>
                                                <div className="flex space-x-2 w-full">
                                                    {file.name !== 'current_menu.png' && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => setAsCurrentMenu(file.name)}
                                                            disabled={isLoading}
                                                            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700"
                                                        >
                                                            Set as Current
                                                        </Button>
                                                    )}
                                                    {file.name !== 'current_menu.png' && (
                                                        <Button 
                                                            variant="destructive" 
                                                            size="sm"
                                                            onClick={() => deleteMenu(file.name)}
                                                            disabled={isLoading}
                                                            className="flex-1"
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                    {file.name === 'current_menu.png' && (
                                                        <div className="w-full text-center text-sm text-zinc-400">
                                                            Current Active Menu
                                                        </div>
                                                    )}
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-zinc-400 p-8 border border-zinc-800 rounded-lg bg-zinc-900/50">
                                    No menu files found. Upload your first menu to get started.
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="background" className="mt-6">
                    <div className="max-w-2xl mx-auto">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-zinc-100">Daily Menu Background</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Customize the background colors for the daily menu page. The colors will create a diagonal split from top-right to bottom-left.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="topColor" className="text-zinc-100">Top Right Color</Label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                id="topColor"
                                                type="color"
                                                value={backgroundColors.topColor}
                                                onChange={(e) => setBackgroundColors(prev => ({ ...prev, topColor: e.target.value }))}
                                                className="w-16 h-10 p-1 bg-zinc-800/50 border-zinc-700"
                                            />
                                            <Input
                                                type="text"
                                                value={backgroundColors.topColor}
                                                onChange={(e) => setBackgroundColors(prev => ({ ...prev, topColor: e.target.value }))}
                                                placeholder="#000000"
                                                className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="bottomColor" className="text-zinc-100">Bottom Left Color</Label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                id="bottomColor"
                                                type="color"
                                                value={backgroundColors.bottomColor}
                                                onChange={(e) => setBackgroundColors(prev => ({ ...prev, bottomColor: e.target.value }))}
                                                className="w-16 h-10 p-1 bg-zinc-800/50 border-zinc-700"
                                            />
                                            <Input
                                                type="text"
                                                value={backgroundColors.bottomColor}
                                                onChange={(e) => setBackgroundColors(prev => ({ ...prev, bottomColor: e.target.value }))}
                                                placeholder="#1a1a1a"
                                                className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="space-y-2">
                                    <Label className="text-zinc-100">Preview</Label>
                                    <div 
                                        className="h-32 rounded-lg border border-zinc-700 relative overflow-hidden"
                                        style={{
                                            background: `linear-gradient(135deg, ${backgroundColors.topColor} 0%, ${backgroundColors.bottomColor} 100%)`
                                        }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-white/80 text-sm font-medium bg-black/20 px-3 py-1 rounded">
                                                Daily Menu Preview
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    onClick={saveBackgroundColors}
                                    disabled={isSavingColors}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    {isSavingColors ? 'Saving...' : 'Save Background Colors'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="info" className="mt-6">
                    <div className="max-w-2xl mx-auto">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-zinc-100">Daily Menu Information</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Customize the information text for the daily menu page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="businessHours" className="text-zinc-100">Business Hours</Label>
                                        <Input
                                            id="businessHours"
                                            value={infoText.businessHours}
                                            onChange={(e) => setInfoText(prev => ({ ...prev, businessHours: e.target.value }))}
                                            className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="orderCutoff" className="text-zinc-100">Order Cutoff</Label>
                                        <Input
                                            id="orderCutoff"
                                            value={infoText.orderCutoff}
                                            onChange={(e) => setInfoText(prev => ({ ...prev, orderCutoff: e.target.value }))}
                                            className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="orderMinimum" className="text-zinc-100">Order Minimum</Label>
                                        <Input
                                            id="orderMinimum"
                                            value={infoText.orderMinimum}
                                            onChange={(e) => setInfoText(prev => ({ ...prev, orderMinimum: e.target.value }))}
                                            className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentMethod" className="text-zinc-100">Payment Method</Label>
                                        <Input
                                            id="paymentMethod"
                                            value={infoText.paymentMethod}
                                            onChange={(e) => setInfoText(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                            className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    onClick={saveInfoText}
                                    disabled={isSavingInfoText}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    {isSavingInfoText ? 'Saving...' : 'Save Info Text'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
