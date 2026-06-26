import Image from 'next/image';

interface ImageGridProps {
    images: string[];
}

export function ImageGrid({ images }: ImageGridProps) {
    const count = images.length;

    if (count === 0) return null;

    // Single image
    if (count === 1) {
        return (
            <div className="w-full">
                <Image
                    src={images[0] || '/placeholder.svg'}
                    alt="Post image"
                    className="h-auto max-h-[500px] w-full object-cover"
                    width={500}
                    height={500}
                />
            </div>
        );
    }

    // Two images - side by side
    if (count === 2) {
        return (
            <div className="grid grid-cols-2 gap-0.5">
                {images.map((img, i) => (
                    <Image
                        key={i}
                        src={img || '/placeholder.svg'}
                        alt={`Post image ${i + 1}`}
                        className="h-[250px] w-full object-cover"
                        width={250}
                        height={250}
                    />
                ))}
            </div>
        );
    }

    // Three images - 1 large on left, 2 stacked on right
    if (count === 3) {
        return (
            <div className="grid h-[400px] grid-cols-2 gap-0.5">
                <Image
                    src={images[0] || '/placeholder.svg'}
                    alt="Post image 1"
                    className="h-full w-full object-cover"
                    width={400}
                    height={400}
                />
                <div className="grid grid-rows-2 gap-0.5">
                    <Image
                        src={images[1] || '/placeholder.svg'}
                        alt="Post image 2"
                        className="h-full w-full object-cover"
                        width={200}
                        height={200}
                    />
                    <Image
                        src={images[2] || '/placeholder.svg'}
                        alt="Post image 3"
                        className="h-full w-full object-cover"
                        width={200}
                        height={200}
                    />
                </div>
            </div>
        );
    }

    // Four images - 2x2 grid
    if (count === 4) {
        return (
            <div className="grid grid-cols-2 gap-0.5">
                {images.map((img, i) => (
                    <Image
                        key={i}
                        src={img || '/placeholder.svg'}
                        alt={`Post image ${i + 1}`}
                        className="h-[200px] w-full object-cover"
                        width={200}
                        height={200}
                    />
                ))}
            </div>
        );
    }

    // Five or more images - 2 large on top, 3+ on bottom with overlay for extras
    return (
        <div className="grid gap-0.5">
            <div className="grid grid-cols-2 gap-0.5">
                <Image
                    src={images[0] || '/placeholder.svg'}
                    alt="Post image 1"
                    className="h-[200px] w-full object-cover"
                    width={200}
                    height={200}
                />
                <Image
                    src={images[1] || '/placeholder.svg'}
                    alt="Post image 2"
                    className="h-[200px] w-full object-cover"
                    width={200}
                    height={200}
                />
            </div>
            <div className="grid grid-cols-3 gap-0.5">
                <Image
                    src={images[2] || '/placeholder.svg'}
                    alt="Post image 3"
                    className="h-[133px] w-full object-cover"
                    width={133}
                    height={133}
                />
                <Image
                    src={images[3] || '/placeholder.svg'}
                    alt="Post image 4"
                    className="h-[133px] w-full object-cover"
                    width={133}
                    height={133}
                />
                <div className="relative">
                    <Image
                        src={images[4] || '/placeholder.svg'}
                        alt="Post image 5"
                        className="h-[133px] w-full object-cover"
                        width={133}
                        height={133}
                    />
                    {count > 5 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="text-3xl font-bold text-white">
                                +{count - 5}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
