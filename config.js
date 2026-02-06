const { useState, useEffect } = React;

// ============================================
// CONFIG - Replace with your Supabase details
// ============================================
const SUPABASE_URL = 'https://hltskzzgbxxhdsdlbfwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdHNrenpnYnh4aGRzZGxiZnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTUwMzgsImV4cCI6MjA4NTk3MTAzOH0.7erP5O69cRhCrGUrAFvaAbw0d_s9pUhV5I4zATPU5sg';

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);