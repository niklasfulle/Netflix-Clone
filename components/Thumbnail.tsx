import useInfoModal from "@/hooks/useInfoModal";
import Image from "next/image";

interface MovieCardProps {
  data: Record<string, any>;
}

const Thumbnail: React.FC<MovieCardProps> = ({ data }) => {
  const { openModal } = useInfoModal();

  return (
    <div
      className="relative h-28 min-w-[180px] cursor-pointer transition duration-200 ease-out md:h-36 md:min-w-[260px] md:hover:scale-105"
      onClick={() => openModal(data?.id)}
    >
      <img
        className="w-full transition shadow-xl cursor-pointer oobject-cover duration rounded-t-md max-w-64 aspect-video"
        src={data.thumbnailUrl}
        alt="Thumbnail"
      />
    </div>
  );
};

export default Thumbnail;
