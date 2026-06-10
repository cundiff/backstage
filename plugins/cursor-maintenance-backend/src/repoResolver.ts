import { CatalogClient } from '@backstage/catalog-client';
import type { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { parseEntityRef } from '@backstage/catalog-model';

const GITLAB_PROJECT_SLUG_ANNOTATION = 'gitlab.com/project-slug';

export async function resolveRepoUrl(options: {
  repoUrl?: string;
  entityRef?: string;
  discovery: DiscoveryService;
  auth: AuthService;
}): Promise<string> {
  if (options.repoUrl) {
    return options.repoUrl;
  }

  if (!options.entityRef) {
    throw new Error('Either repoUrl or entityRef is required');
  }

  const { kind, namespace, name } = parseEntityRef(options.entityRef);
  const catalogApi = new CatalogClient({
    discoveryApi: {
      getBaseUrl: async (pluginId: string) =>
        options.discovery.getBaseUrl(pluginId),
    },
  });

  const { token } = await options.auth.getPluginRequestToken({
    onBehalfOf: await options.auth.getOwnServiceCredentials(),
    targetPluginId: 'catalog',
  });

  const entity = await catalogApi.getEntityByRef(
    { kind, namespace, name },
    { token },
  );

  if (!entity) {
    throw new Error(`Entity not found: ${options.entityRef}`);
  }

  const projectSlug =
    entity.metadata.annotations?.[GITLAB_PROJECT_SLUG_ANNOTATION];

  if (!projectSlug) {
    throw new Error(
      `Entity ${options.entityRef} is missing ${GITLAB_PROJECT_SLUG_ANNOTATION} annotation`,
    );
  }

  return `https://gitlab.com/${projectSlug}`;
}
