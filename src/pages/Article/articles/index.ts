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
    'bloated_mess': bloatedMess,
    'beware_of_coach': bewareOfCoach,
    'mike_ohearn': healthyBody,
    'head_size': headSize,
    'tactical_patterns': tacticalPatterns,
    'analyze_games': analyzeGames,
    'elf_incident': elfIncident,
    'crab_incident': crabIncident,
};

export default articles;
