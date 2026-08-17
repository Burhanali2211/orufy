import { useNetwork } from '../components/Common/NetworkStatusProvider';

export const useNetworkAdaptation = () => ({
  shouldLoadImages: true,
  shouldLoadAnimations: true,
  shouldUseOptimizedQueries: false,
});

export { useNetwork };