import type { AlbumGroup, GalleryPhoto } from "../../../types/album";

export interface AlbumCardProps {
	album: AlbumGroup;
}

export interface PhotoCardProps {
	src?: string;
	alt?: string;
	albumId?: string;
	photo?: GalleryPhoto;
	flowClone?: boolean;
}
