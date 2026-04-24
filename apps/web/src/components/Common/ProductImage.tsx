import React from 'react';
import { globalResourceManager } from '../../utils/resourceManager.tsx';
import { RequestPriority } from '../../utils/networkResilience';
import { useNetwork, useNetworkAdaptation } from '@/contexts/NetworkStatusContext';
import { performanceMonitor } from '../../utils/performance';
import { useImagePerformance } from '../../utils/performance';
import { normalizeImageUrl, isValidImageUrl, getFirstValidImage } from '../../utils/imageUrlUtils';

interface ProductImageProps {
    product: {
        name: string;
        images?: string[];
        id: string;
    };
    className?: string;
    alt?: string;
    size?: 'small' | 'medium' | 'large';
    priority?: RequestPriority; // Add priority support
    onError?: () => void;
    onLoad?: () => void; // Add load callback
}

export const ProductImage: React.FC<ProductImageProps> = ({
    product,
    className = '',
    alt,
    size = 'medium',
    priority = 'normal',
    onError,
    onLoad
}) => {
    const [imageError, setImageError] = React.useState(false);
    const [currentImage, setCurrentImage] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isInView, setIsInView] = React.useState(priority === 'critical');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const network = useNetworkAdaptation();
    // We're not using the performance hooks for now to simplify the component
    // const { startLoading, endLoading } = useImagePerformance(product.images?.[currentImage] || '');

    // Intersection Observer for better lazy loading
    React.useEffect(() => {
        if (priority === 'critical' || isInView) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '100px', // Start loading 100px before image enters viewport
                threshold: 0.01
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [priority, isInView]);

    // Get the first valid image URL using utility functions
    const getImageUrl = () => {
        if (product.images && product.images.length > 0) {
            // Normalize all image URLs
            const normalizedImages = product.images
                .map(img => normalizeImageUrl(img))
                .filter(img => img !== '' && isValidImageUrl(img));

            if (normalizedImages.length > 0) {
                return normalizedImages[currentImage] || normalizedImages[0];
            }
        }
        return null;
    };

    // Generate fallback image with first letter
    const generateFallbackImage = (name: string) => {
        const firstLetter = name.charAt(0).toUpperCase();
        const colors = [
            { bg: '#E3F2FD', text: '#1976D2' }, // Blue
            { bg: '#F3E5F5', text: '#7B1FA2' }, // Purple
            { bg: '#E8F5E8', text: '#388E3C' }, // Green
            { bg: '#FFF3E0', text: '#F57C00' }, // Orange
            { bg: '#FCE4EC', text: '#C2185B' }, // Pink
            { bg: '#E0F2F1', text: '#00796B' }, // Teal
            { bg: '#FFF8E1', text: '#F9A825' }, // Amber
            { bg: '#EFEBE9', text: '#5D4037' }, // Brown
        ];

        // Use first letter to determine color
        const normalizedIndex = Math.abs(firstLetter.charCodeAt(0)) % colors.length;
        const color = normalizedIndex >= 0 && normalizedIndex < colors.length
            ? colors[normalizedIndex]
            : colors[0];

        // Size configurations
        const sizeConfig = {
            small: { width: 100, height: 100, fontSize: 32 },
            medium: { width: 200, height: 200, fontSize: 64 },
            large: { width: 400, height: 400, fontSize: 128 }
        };

        const config = sizeConfig[size];

        const bgColor = color?.bg || '#E3F2FD';
        const textColor = color?.text || '#1976D2';

        const svg = `
      <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" 
              font-size="${config.fontSize}" font-weight="600" 
              fill="${textColor}" text-anchor="middle" 
              dominant-baseline="central">${firstLetter}</text>
      </svg>
    `;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    };

    const handleImageError = () => {
        if (!imageError) {
            setImageError(true);
            setIsLoading(false);
            if (onError) onError();
        }
    };

    const handleImageLoad = () => {
        setIsLoading(false);
        if (onLoad) onLoad();
    };

    const imageUrl = getImageUrl();
    const isBase64 = imageUrl?.startsWith('data:image/');
    const shouldLoad = isInView || priority === 'critical';
    const shouldShowFallback = !imageUrl || imageError || (!network.shouldLoadImages && !isBase64);

    // Handle network changes
    React.useEffect(() => {
        if (!network.shouldLoadImages && !isBase64) {
            setIsLoading(false);
        }
    }, [network.shouldLoadImages, isBase64]);

    // If it's a data URL, it's already loaded
    React.useEffect(() => {
        if (imageUrl && isBase64) {
            setIsLoading(false);
            setImageError(false); // Reset error state for base64 images
        }
    }, [imageUrl, isBase64]);

    const finalImageUrl = shouldShowFallback 
        ? generateFallbackImage(product.name) 
        : imageUrl || generateFallbackImage(product.name);

    return (
        <>
            {isLoading && network.shouldLoadImages && !isBase64 && shouldLoad && (
                // Show skeleton loader while loading
                <div className={`bg-gray-200 animate-pulse ${className}`} />
            )}
            <div ref={containerRef} style={{ display: 'contents' }}>
                <img
                    src={finalImageUrl}
                    alt={alt || product.name}
                    className={className}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    loading={priority === 'critical' ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={priority === 'critical' ? 'high' : 'auto'}
                    style={{ 
                        display: isLoading && network.shouldLoadImages && !isBase64 && shouldLoad ? 'none' : 'block',
                        objectFit: 'cover'
                    }}
                />
            </div>
        </>
    );
};

export default ProductImage;