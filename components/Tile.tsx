import { FC } from 'react'
import { TileData } from '@/types'
import style from './Tile.module.scss'

interface TileProps extends TileData {
  location: [number, number]
}

const Tile: FC<TileProps> = ({ letter, score }) => {
  return (
    <div className={style.tile}>
      {letter}
      <div className={style.tileScore}>
        {score}
      </div>
    </div>
  )
}

export default Tile
