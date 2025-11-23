"use client";

import { useState } from "react";

type UploadMode = "json" | "photo" | null;

export default function Home() {
	const [uploadMode, setUploadMode] = useState<UploadMode>(null);
	const [title, setTitle] = useState<string>("");
	const [words, setWords] = useState<string[]>([]);
	const [showGrid, setShowGrid] = useState(false);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [showEditWords, setShowEditWords] = useState(false);

	const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const parsed = JSON.parse(content);
				
				// Handle different JSON structures
				let wordList: string[] = [];
				let titleText = "";
				
				if (Array.isArray(parsed)) {
					wordList = parsed;
				} else if (parsed.words && Array.isArray(parsed.words)) {
					wordList = parsed.words;
					titleText = parsed.title || "";
				} else {
					alert("Invalid JSON format. Please provide an array of words or an object with a 'words' array.");
					return;
				}

				setTitle(titleText);
				setWords(wordList);
				setShowGrid(true);
			} catch (error) {
				alert("Error parsing JSON file. Please check the file format.");
				console.error(error);
			}
		};
		reader.readAsText(file);
	};

	const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('Image size must be less than 5MB');
			return;
		}

		const reader = new FileReader();
		reader.onload = async (e) => {
			const base64Image = e.target?.result as string;
			setPhotoPreview(base64Image);
			setIsAnalyzing(true);

			try {
				const response = await fetch('/api/analyze-photo', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ image: base64Image }),
				});

				if (!response.ok) {
					const errorData = await response.json() as { error?: string };
					throw new Error(errorData.error || 'Failed to analyze photo');
				}

				const data = await response.json() as { title?: string; words?: string[] };
				
				// If this is an additional photo (showEditWords is true), merge the words
				if (showEditWords) {
					// Add new words to existing words, avoiding duplicates
					const newWords = data.words || [];
					const existingWordsSet = new Set(words);
					const uniqueNewWords = newWords.filter(word => !existingWordsSet.has(word));
					setWords([...words, ...uniqueNewWords]);
					setPhotoPreview(null); // Clear preview after merging
				} else {
					// First photo - replace everything
					setTitle(data.title || "");
					setWords(data.words || []);
					setShowEditWords(true);
				}
			} catch (error) {
				console.error('Error analyzing photo:', error);
				alert('Failed to analyze photo. Please try again.');
				setPhotoPreview(null);
			} finally {
				setIsAnalyzing(false);
				// Reset file input
				event.target.value = '';
			}
		};
		reader.readAsDataURL(file);
	};

	const handleEditWord = (index: number, newValue: string) => {
		const newWords = [...words];
		newWords[index] = newValue;
		setWords(newWords);
	};

	const handleRemoveWord = (index: number) => {
		const newWords = words.filter((_, i) => i !== index);
		setWords(newWords);
	};

	const handleAddWord = () => {
		setWords([...words, ""]);
	};

	const handleGenerateGrid = () => {
		if (words.length === 0) {
			alert('Please add at least one word');
			return;
		}
		setShowGrid(true);
		setShowEditWords(false);
		setPhotoPreview(null);
	};

	const handlePrint = () => {
		window.print();
	};

	const handleReset = () => {
		setUploadMode(null);
		setTitle("");
		setWords([]);
		setShowGrid(false);
		setPhotoPreview(null);
		setShowEditWords(false);
	};

	// Landing page - choose upload method
	if (!uploadMode) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
				<div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-2xl w-full">
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 text-center">
						Circle Game
					</h1>
					<p className="text-gray-600 mb-8 text-center">
						Create a printable Chinese word grid for the circle game
					</p>
					
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						{/* Photo Upload Option */}
						<button
							onClick={() => setUploadMode("photo")}
							className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all"
						>
							<svg className="w-16 h-16 mb-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">Take/Upload Photo</h3>
							<p className="text-sm text-gray-600 text-center">
								AI will extract words from worksheet
							</p>
						</button>

						{/* JSON Upload Option */}
						<button
							onClick={() => setUploadMode("json")}
							className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all"
						>
							<svg className="w-16 h-16 mb-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">Upload JSON File</h3>
							<p className="text-sm text-gray-600 text-center">
								Manual word list from JSON file
							</p>
						</button>
					</div>
				</div>
			</div>
		);
	}

	// JSON Upload Screen
	if (uploadMode === "json" && !showGrid) {
	return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
				<div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full">
					<button
						onClick={() => setUploadMode(null)}
						className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
					>
						← Back
					</button>
					
					<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
						Upload JSON File
					</h2>
					
					<label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
						<div className="flex flex-col items-center justify-center pt-5 pb-6">
							<svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
							</svg>
							<p className="mb-2 text-sm text-gray-500">
								<span className="font-semibold">Click to upload</span>
							</p>
							<p className="text-xs text-gray-500">JSON file with word array</p>
						</div>
						<input 
							type="file" 
							className="hidden" 
							accept=".json"
							onChange={handleJsonUpload}
						/>
					</label>

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
						<p className="text-sm text-blue-800">
							<strong>Expected format:</strong>
						</p>
						<pre className="text-xs text-blue-700 mt-2 bg-white p-2 rounded overflow-x-auto">
{`["词语1", "词语2"]

or

{
  "title": "动物篇",
  "words": ["词语1", "词语2"]
}`}
						</pre>
					</div>
				</div>
			</div>
		);
	}

	// Photo Upload Screen
	if (uploadMode === "photo" && !showEditWords && !showGrid) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
				<div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full">
					<button
						onClick={() => setUploadMode(null)}
						className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
					>
						← Back
					</button>
					
					<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
						Take or Upload Photo
					</h2>

					{photoPreview ? (
						<div className="space-y-4">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={photoPreview} alt="Preview" className="w-full rounded-lg" />
							{isAnalyzing && (
								<div className="text-center">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
									<p className="mt-4 text-gray-600">Analyzing with AI...</p>
								</div>
							)}
						</div>
					) : (
						<>
							{/* Mobile: Camera */}
							<label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors mb-4 sm:hidden">
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									<p className="mb-2 text-sm text-gray-500">
										<span className="font-semibold">Take Photo</span>
									</p>
									<p className="text-xs text-gray-500">Use camera</p>
								</div>
								<input 
									type="file" 
									className="hidden" 
									accept="image/*"
									capture="environment"
									onChange={handlePhotoUpload}
								/>
							</label>

							{/* Desktop: File Upload */}
							<label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<p className="mb-2 text-sm text-gray-500">
										<span className="font-semibold">Upload Photo</span>
									</p>
									<p className="text-xs text-gray-500">JPG, PNG, WebP (max 5MB)</p>
								</div>
								<input 
									type="file" 
									className="hidden" 
									accept="image/*"
									onChange={handlePhotoUpload}
								/>
							</label>
						</>
					)}
				</div>
			</div>
		);
	}

	// Edit Words Screen
	if (showEditWords && !showGrid) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="bg-white rounded-2xl shadow-xl overflow-hidden">
						{/* Header Section - Fixed */}
						<div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 sm:px-8 py-6">
							<h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
								Review & Edit Words
							</h2>
							{!isAnalyzing && (
								<p className="text-indigo-100">
									{words.length} words • Edit, add, or remove as needed
								</p>
							)}
						</div>

						{/* Content Section - Scrollable */}
						<div className="p-6 sm:p-8 space-y-6">
							{/* Title Input */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Title (optional)
								</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium text-gray-900 bg-white transition-all"
									placeholder="e.g. 形容词篇, 动物篇"
								/>
							</div>

							{/* Loading State */}
							{isAnalyzing && (
								<div className="text-center py-12 bg-indigo-50 rounded-xl border-2 border-indigo-200">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
									<p className="text-indigo-700 font-medium">Analyzing additional photo...</p>
								</div>
							)}

							{/* Words Grid */}
							<div>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-semibold text-gray-800">Words</h3>
									<span className="text-sm text-gray-500">{words.length} total</span>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
									{words.map((word, index) => (
										<div key={index} className="relative group">
											<input
												type="text"
												value={word}
												onChange={(e) => handleEditWord(index, e.target.value)}
												className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base font-medium text-gray-900 bg-white transition-all hover:border-gray-300"
												placeholder="词语"
											/>
											<button
												onClick={() => handleRemoveWord(index)}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
												title="Remove"
											>
												{/* Trash icon for mobile, X icon for desktop */}
												<svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
												<svg className="w-5 h-5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Actions Section - Fixed at Bottom */}
						<div className="bg-gray-50 px-6 sm:px-8 py-6 border-t border-gray-200">
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
								<button
									onClick={handleAddWord}
									className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-sm"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									Add Word
								</button>
								<label className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold transition-all cursor-pointer shadow-sm">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									Add Photo
									<input 
										type="file" 
										className="hidden" 
										accept="image/*"
										capture="environment"
										onChange={handlePhotoUpload}
									/>
								</label>
								<button
									onClick={() => {
										setShowEditWords(false);
										setPhotoPreview(null);
									}}
									className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-sm"
								>
									Cancel
								</button>
								<button
									onClick={handleGenerateGrid}
									className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3.5 rounded-xl font-semibold transition-all shadow-md"
				>
									Generate Grid
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
		</div>
	);
	}

	// Word Grid Display (for printing)
	if (showGrid) {
		return (
			<>
				{/* Print button - hidden when printing */}
				<div className="print:hidden fixed top-4 right-4 z-10 flex gap-4">
					<button
						onClick={handleReset}
						className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg font-semibold transition-colors text-sm sm:text-base"
					>
						← Back
					</button>
					<button
						onClick={handlePrint}
						className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg font-semibold transition-colors text-sm sm:text-base"
					>
						🖨️ Print
					</button>
				</div>

				{/* Word Grid */}
				<div className="min-h-screen p-8 sm:p-12 print:p-6 bg-white">
					{title && (
						<h1 className="text-3xl sm:text-4xl print:text-3xl font-bold text-center text-black mb-8 print:mb-6">
							{title}
						</h1>
					)}
					<div className="grid grid-cols-5 gap-6 sm:gap-8 print:gap-4 w-full print:w-full print:max-w-none">
						{words.map((word, index) => (
							<div
								key={index}
								className="flex items-center justify-center p-4 sm:p-6 print:p-3"
							>
								<span className="text-2xl sm:text-3xl print:text-xl font-medium text-black text-center break-keep">
									{word}
								</span>
							</div>
						))}
					</div>
				</div>
			</>
		);
	}

	return null;
}
