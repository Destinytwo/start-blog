import type { MomentItem } from "../../../data/moments";

export interface MomentCardProps {
	moment: MomentItem;
	index: number;
	commentRepo: string;
	commentLabel: string;
}
