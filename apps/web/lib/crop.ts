import { Area } from 'react-easy-crop';
import Resizer from 'react-image-file-resizer';

export const readFile = (file: File) => {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.addEventListener(
            'load',
            () => resolve(<string>reader.result),
            false,
        );
        reader.readAsDataURL(file);
    });
};

export const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180;
}

export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) +
            Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) +
            Math.abs(Math.cos(rotRad) * height),
    };
}

export default async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    flip = { horizontal: false, vertical: false },
) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const resizeCanvas = document.createElement('canvas');
    const resizeCtx = resizeCanvas.getContext('2d');

    if (!ctx || !resizeCtx) {
        return null;
    }

    const rotRad = getRadianAngle(rotation);

    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation,
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
    );

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(data, 0, 0);

    return new Promise<string | null>((resolve) => {
        canvas.toBlob((file) => {
            resolve(URL.createObjectURL(file!));
        }, 'image/jpeg');
    });
}

export const resizeBlob = (file: Blob, resizeHeight = 300, resizeWidth = 300) =>
    new Promise<string | Blob | File | ProgressEvent<FileReader>>((resolve) => {
        Resizer.imageFileResizer(
            file,
            resizeWidth,
            resizeHeight,
            'WEBP',
            80,
            0,
            (uri) => {
                resolve(uri);
            },
            'blob',
        );
    });
