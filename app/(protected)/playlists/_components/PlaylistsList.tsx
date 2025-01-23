import { isEmpty } from 'lodash';
import React from 'react';

import PlaylistAddCard from './PlaylistAddCard';
import PlaylistCard from './PlaylistCard';

interface PlaylistListProps {
  data: Record<string, any>[];
  title: string;
  isLoading: boolean;
  openModalCreate: any;
  openModalEdit: any;
}

const PlaylistsList: React.FC<PlaylistListProps> = ({
  data,
  title,
  isLoading,
  openModalCreate,
  openModalEdit,
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
                openModalEdit={openModalEdit}
              />
            ))}
          <PlaylistAddCard openModalCreate={openModalCreate} />
        </div>
      </div>
    </div>
  );
};

export default PlaylistsList;
