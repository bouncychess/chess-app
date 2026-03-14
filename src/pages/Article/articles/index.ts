import type { ArticleData } from '../types';
import bloatedMess from './bloated-mess';
import bewareOfCoach from './beware-of-coach';
import healthyBody from './healthy-body';
import headSize from './head-size';
import tacticalPatterns from './tactical-patterns';
import analyzeGames from './analyze-games';
import elfIncident from './elf-incident';
import crabIncident from './crab-incident';

const articles: Record<string, ArticleData> = {
    '1': bloatedMess,
    '2': bewareOfCoach,
    'mike_ohearn': healthyBody,
    '4': headSize,
    '5': tacticalPatterns,
    '6': analyzeGames,
    'elf_incident': elfIncident,
    'crab_incident': crabIncident,
};

export default articles;
