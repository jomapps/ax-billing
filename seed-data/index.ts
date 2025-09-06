/**
 * Seed Data Index
 * 
 * This file exports all seed data for easy importing in other scripts
 */

import serviceCategories from './service-categories.json'
import serviceOptions from './service-options.json'
import customerTiers from './customer-tiers.json'
import services from './services.json'
import users from './users.json'
import vehicles from './vehicles.json'
import orders from './orders.json'

export {
  serviceCategories,
  serviceOptions,
  customerTiers,
  services,
  users,
  vehicles,
  orders
}

export const seedData = {
  serviceCategories,
  serviceOptions,
  customerTiers,
  services,
  users,
  vehicles,
  orders
}

export default seedData
