import React from "react";
import { isEmpty } from "lodash";
import PlaylistCard from "./PlaylistCard";
import PlaylistAddCard from "./PlaylistAddCard";

interface PlaylistListProps {
  data: Record<string, any>[];
  title: string;
  isLoading: boolean;
  openModal: any;
}

const PlaylistsList: React.FC<PlaylistListProps> = ({
  data,
  title,
  isLoading,
  openModal,
}) => {
  return (
    <div className="px-4 my-6 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4 lg:grid-cols-4 md:gap-4">
          {!isEmpty(data) &&
            data.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                data={playlist}
                isLoading={isLoading}
              />
            ))}
          <PlaylistAddCard openModal={openModal} />
        </div>
      </div>
    </div>
  );
};

export default PlaylistsList;
