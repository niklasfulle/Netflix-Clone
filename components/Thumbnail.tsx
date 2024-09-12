import useInfoModal from "@/hooks/useInfoModal";
import Image from "next/image";

interface MovieCardProps {
  data: Record<string, any>;
}

function calculateBarWidth(duration: string, watchTime: number): any {
  let i: string[] = duration.split(":");
  let sec: number;
  if (i.length == 1) {
    sec = parseInt(i[0]);
  } else if (i.length == 2) {
    sec = parseInt(i[0]) * 60 + parseInt(i[1]);
  } else if (i.length == 3) {
    sec = parseInt(i[0]) * 60 * 60 + parseInt(i[1]) * 60 + parseInt(i[2]);
  }

  return Math.floor(watchTime / (sec! / 100));
}

const Thumbnail: React.FC<MovieCardProps> = ({ data }) => {
  const { openModal } = useInfoModal();
  let barWidth: any = calculateBarWidth(data?.duration, data?.watchTime) + "%";

  return (
    <div
      className="relative h-28 min-w-[180px] cursor-pointer transition duration-200 ease-out md:h-36 md:min-w-[260px] md:hover:scale-105"
      onClick={() => openModal(data?.id)}
    >
      <div className="relative">
        <Image
          className="w-full transition shadow-xl cursor-pointer oobject-cover duration rounded-t-md max-w-64 aspect-video"
          src={data.thumbnailUrl}
          alt="Thumbnail"
          width={500}
          height={500}
        />
        {data.watchTime != undefined && (
          <>
            <div
              className="absolute z-10 h-1 bg-red-600"
              style={{
                width: barWidth,
              }}
            ></div>
            <div className="absolute w-full h-1 bg-black"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default Thumbnail;
