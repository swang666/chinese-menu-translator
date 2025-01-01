# Chinese Menu Translator

A web application that helps Chinese travelers translate English menus into Chinese, complete with dish descriptions.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Image Processing**: OCR (Optical Character Recognition)
- **Translation**: Translation API (TBD)

## Features

### Core Functionality
1. **Menu Photo Capture**
   - Take a photo using device camera
   - Upload existing image from device
   - Support for common image formats (JPG, PNG)

2. **Text Recognition**
   - Extract text from menu images using OCR
   - Identify menu items and prices
   - Handle multiple columns and sections

3. **Translation**
   - Translate menu items from English to Chinese
   - Provide dish descriptions and cultural context
   - Maintain formatting and price information

### User Journey

1. User opens the web application
2. Clicks "Take Photo" or "Upload Image" button
3. Points camera at English menu or selects saved menu image
4. App processes image and extracts text
5. Displays translated menu in Chinese with:
   - Dish names
   - Descriptions
   - Prices
   - (Optional) Cultural notes or ingredients

## Development Roadmap

### Phase 1: Basic Setup
- [x] Initialize Next.js project
- [x] Install and configure shadcn/ui
- [x] Create basic UI layout
- [x] Implement camera/upload functionality

### Phase 2: Core Features
- [ ] Integrate OCR service
- [ ] Implement translation API
- [ ] Add error handling
- [ ] Implement loading states

### Phase 3: Enhancements
- [ ] Add image preprocessing
- [ ] Improve translation accuracy
- [ ] Add dish descriptions
- [ ] Implement save/history feature

## Getting Started

1. Clone the repository
