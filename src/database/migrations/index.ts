import { Migration } from './migration-runner';
import { createEnumsMigration } from './001-create-enums';
import { createUsersTableMigration } from './002-create-users-table';
import { createUserProfilesTableMigration } from './003-create-user-profiles-table';
import { createOAuthAccountsTableMigration } from './004-create-oauth-accounts-table';
import { createRefreshTokensTableMigration } from './005-create-refresh-tokens-table';
import { createPasswordResetTokensTableMigration } from './006-create-password-reset-tokens-table';
import { createMFASettingsTableMigration } from './007-create-mfa-settings-table';
import { createBusinessesTableMigration } from './008-create-businesses-table';
import { createDemandListingsTableMigration } from './009-create-demand-listings-table';
import { createBusinessMetricsTableMigration } from './010-create-business-metrics-table';
import { createBusinessInvitesTableMigration } from './011-create-business-invites-table';
import { addListingFieldsToDemandListingsMigration } from './012-add-listing-fields-to-demand-listings';
import { addQfpFieldsToDemandListingsMigration } from './013-add-qfp-fields-to-demand-listings';
import { createPropertyListingsTableMigration } from './014-create-property-listings-table';
import { createPropertyListingMetricsTableMigration } from './015-create-property-listing-metrics-table';
import { createMessagingTablesMigration } from './016-create-messaging-tables';
import { createPropertyMatchesMigration } from './017-create-property-matches-table';
import { createNotificationPreferencesMigration } from './018-create-notification-preferences-table';
import { createSubscriptionsTablesMigration } from './019-create-subscriptions-tables';
import { addPropertyMetricsMigration } from './020-add-property-metrics';
import { createBrokerProfileTableMigration } from './021-create-broker-profile-table';
import { createBrokerDealsTableMigration } from './022-create-broker-deals-table';
import { createBusinessProfilesTableMigration } from './023-create-business-profiles-table';
import { createBusinessTeamMembersTableMigration } from './024-create-business-team-members-table';
import { createTenantPublicProfilesTableMigration } from './025-create-tenant-public-profiles-table';
import { createTenantProfileImagesTableMigration } from './026-create-tenant-profile-images-table';
import { createTenantProfileDocumentsTableMigration } from './027-create-tenant-profile-documents-table';
import { createTenantLocationsTableMigration } from './028-create-tenant-locations-table';
import { createBrokerTenantRequestsTableMigration } from './029-create-broker-tenant-requests-table';
import { createBusinessProfileStatsTableMigration } from './030-create-business-profile-stats-table';
import { enhanceDemandListingsTableMigration } from './031-enhance-demand-listings-table';

// Export all migrations in order
export const migrations: Migration[] = [
  createEnumsMigration,
  createUsersTableMigration,
  createUserProfilesTableMigration,
  createOAuthAccountsTableMigration,
  createRefreshTokensTableMigration,
  createPasswordResetTokensTableMigration,
  createMFASettingsTableMigration,
  createBusinessesTableMigration,
  createDemandListingsTableMigration,
  createBusinessMetricsTableMigration,
  createBusinessInvitesTableMigration,
  addListingFieldsToDemandListingsMigration,
  addQfpFieldsToDemandListingsMigration,
  createPropertyListingsTableMigration,
  createPropertyListingMetricsTableMigration,
  createMessagingTablesMigration,
  createPropertyMatchesMigration,
  createNotificationPreferencesMigration,
  createSubscriptionsTablesMigration,
  addPropertyMetricsMigration,
  createBrokerProfileTableMigration,
  createBrokerDealsTableMigration,
  createBusinessProfilesTableMigration,
  createBusinessTeamMembersTableMigration,
  createTenantPublicProfilesTableMigration,
  createTenantProfileImagesTableMigration,
  createTenantProfileDocumentsTableMigration,
  createTenantLocationsTableMigration,
  createBrokerTenantRequestsTableMigration,
  createBusinessProfileStatsTableMigration,
  enhanceDemandListingsTableMigration,
];
