/* @flow */

import R from 'ramda';

import { transformResWithGqlQuery } from '../utils';
import infoFromRes from './infoFromRes';
import TmdbConnector from './connector';
import type { TmdbApi$GetMovieDetailsResponse } from './types';
import type { TmdbConnectorConfig } from './connector';

class Tmdb {
  _connector: TmdbConnector;

  constructor(config: void | TmdbConnectorConfig) {
    this._connector = new TmdbConnector(config);
  }

  getId = async (query: {
    title?: string,
    year?: number,
    imdbId?: string,
    isTvShow?: boolean,
  }) => {
    if (query.imdbId) {
      const res = await this._connector.apiGet(
        `find/${query.imdbId}`,
        { external_source: 'imdb_id' },
      );

      const results = query.isTvShow
        ? R.propOr([], 'tv_results', res)
        : R.propOr([], 'movie_results', res);

      return R.pipe(R.head, R.prop('id'))(results);
    }

    if (query.title) {
      const res = await this._connector.apiGet(
        `search/${query.isTvShow ? 'tv' : 'movie'}`,
        { query: query.title, year: query.year },
      );

      return R.pipe(R.prop('results'), R.head, R.prop('id'))(res);
    }

    return null;
  }

  getInfo = async (id: number, query: void | string) => {
    const res: ?TmdbApi$GetMovieDetailsResponse = await this._connector.apiGet(
      `movie/${id}`,
      { append_to_response: ['credits', 'keywords', 'videos'].join(',') },
    );

    if (!res) return null;

    return transformResWithGqlQuery(infoFromRes(res, query), query);
  }
}

export default Tmdb;