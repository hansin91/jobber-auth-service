import { ISearchGig, getGigById, searchGigs } from '@auth/services/search.service';
import { IPaginateProps, ISearchResult } from '@hansin91/jobber-shared';
import { Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sortBy } from 'lodash';

class SearchController {

  public gigs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { from, size, type } = req.params;
      let resultHits: unknown[] = [];
      const paginate: IPaginateProps = { from, size: parseInt(`${size}`), type };
      const searchGigsParam: ISearchGig = {
        searchQuery: req.query.query as string,
        paginate,
        deliveryTime: req.query.delivery_time as string,
        min: parseInt(`${req.query.minPrice}`),
        max: parseInt(`${req.query.maxPrice}`)
      };
      const gigs: ISearchResult = await searchGigs(searchGigsParam);
      for (const gig of gigs.hits) {
        resultHits.push(gig._source);
      }
      if (type === 'backward') {
        resultHits = sortBy(resultHits, ['sortId']);
      }
      res.status(StatusCodes.OK).json({ message: 'Search gigs results', total: gigs.total, gigs: resultHits });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
    }
  };

  public getSingleGigById = async (req: Request, res: Response): Promise<void> => {
    try {
      const gig = await getGigById('gigs', req.params.gigId);
      res.status(StatusCodes.OK).json({ message: 'Single gig result', gig });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
    }
  };
}

export const searchController = new SearchController();