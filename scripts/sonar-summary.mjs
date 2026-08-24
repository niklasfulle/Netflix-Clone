#!/usr/bin/env node

const [sonarHostUrlArgument, projectKey] = process.argv.slice(2);
const token = process.env.SONAR_TOKEN;

if (!sonarHostUrlArgument || !projectKey || !token) {
  console.error('Sonar-Zusammenfassung benötigt Server-URL, Projekt-Key und SONAR_TOKEN.');
  process.exitCode = 1;
} else {
  await printSummary(sonarHostUrlArgument, projectKey, token);
}

async function printSummary(sonarHostUrlArgument, projectKey, token) {
  const sonarHostUrl = sonarHostUrlArgument.replace(/\/$/, '');
  const authorization = Buffer.from(`${token}:`, 'utf8').toString('base64');
  const request = async (path, parameters) => {
    const url = new URL(`${sonarHostUrl}${path}`);
    for (const [key, value] of Object.entries(parameters)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${authorization}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`${path} antwortete mit HTTP ${response.status}`);
    }
    return response.json();
  };

  try {
    const [qualityGate, issues, measures] = await Promise.all([
      request('/api/qualitygates/project_status', { projectKey }),
      request('/api/issues/search', {
        componentKeys: projectKey,
        statuses: 'OPEN,CONFIRMED',
        facets: 'severities,types',
        ps: '1',
      }),
      request('/api/measures/component', {
        component: projectKey,
        metricKeys: [
          'ncloc',
          'coverage',
          'duplicated_lines_density',
          'bugs',
          'vulnerabilities',
          'code_smells',
          'security_hotspots',
        ].join(','),
      }),
    ]);

    const projectStatus = qualityGate.projectStatus ?? {};
    const metricValues = new Map(
      (measures.component?.measures ?? []).map(({ metric, value }) => [metric, value]),
    );

    console.log('');
    console.log('================ SonarQube-Übersicht ================');
    console.log(`Quality Gate: ${formatQualityGateStatus(projectStatus.status)}`);

    const failedConditions = (projectStatus.conditions ?? []).filter(
      ({ status }) => status !== 'OK',
    );
    if (failedConditions.length > 0) {
      console.log('Fehlgeschlagene Quality-Gate-Bedingungen:');
      for (const condition of failedConditions) {
        const threshold = condition.errorThreshold
          ? `, Grenzwert ${condition.comparator ?? ''} ${condition.errorThreshold}`.replace('  ', ' ')
          : '';
        console.log(`  - ${condition.metricKey}: ${condition.actualValue ?? '–'}${threshold}`);
      }
    }

    console.log(`Offene Issues: ${issues.total ?? 0}`);
    printFacet(issues.facets, 'severities', 'Nach Schweregrad');
    printFacet(issues.facets, 'types', 'Nach Typ');

    console.log('Kennzahlen:');
    printMetric(metricValues, 'coverage', 'Coverage', '%');
    printMetric(metricValues, 'duplicated_lines_density', 'Duplikate', '%');
    printMetric(metricValues, 'ncloc', 'Codezeilen');
    printMetric(metricValues, 'bugs', 'Bugs');
    printMetric(metricValues, 'vulnerabilities', 'Vulnerabilities');
    printMetric(metricValues, 'code_smells', 'Code Smells');
    printMetric(metricValues, 'security_hotspots', 'Security Hotspots');

    const dashboardUrl = new URL('/dashboard', `${sonarHostUrl}/`);
    dashboardUrl.searchParams.set('id', projectKey);
    console.log(`Dashboard: ${dashboardUrl}`);
    console.log('======================================================');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`SonarQube-Übersicht konnte nicht geladen werden: ${message}`);
    process.exitCode = 1;
  }
}

function formatQualityGateStatus(status) {
  if (status === 'OK') return 'BESTANDEN';
  if (status === 'ERROR') return 'FEHLGESCHLAGEN';
  return status ?? 'UNBEKANNT';
}

function printFacet(facets, property, label) {
  const values = facets?.find((facet) => facet.property === property)?.values ?? [];
  const populatedValues = values.filter(({ count }) => count > 0);
  if (populatedValues.length === 0) return;

  const facetSummary = populatedValues.map(({ val, count }) => `${val} ${count}`).join(', ');
  console.log(`  ${label}: ${facetSummary}`);
}

function printMetric(metricValues, key, label, suffix = '') {
  const value = metricValues.get(key);
  if (value !== undefined) {
    console.log(`  ${label}: ${value}${suffix}`);
  }
}
