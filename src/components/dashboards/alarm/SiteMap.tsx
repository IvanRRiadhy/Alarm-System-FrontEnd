import React from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet';

import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

export interface ActiveAlarmSite {
  siteId: string;
  siteName: string;
  region: string;
  latitude: number;
  longitude: number;
  severity: string;
  status: string;
  totalAlarms: number;
  totalDeviceOn: number;
  totalDeviceOff: number;
  totalAlarmOn: number;
  totalAlarmOff: number;
  lastAlarmAt: string;
}

type SiteMapProps = {
  region: string;
  activeAlarmsBySite?: ActiveAlarmSite[];
  height?: string | number;
};

interface Site {
  id: number;
  name: string;
  region: string;
  lat: number;
  lng: number;
  status: 'normal' | 'alarm' | 'trouble' | 'offline';
  alarms: number;
}

// const sites: Site[] = [
//   {
//     id: 1,
//     name: 'Medan Hub',
//     region: 'Sumatera Utara',
//     lat: 3.5952,
//     lng: 98.6722,
//     status: 'normal',
//     alarms: 23,
//   },
//   {
//     id: 2,
//     name: 'Jakarta SOC',
//     region: 'DKI Jakarta',
//     lat: -6.2088,
//     lng: 106.8456,
//     status: 'alarm',
//     alarms: 8,
//   },
//   {
//     id: 3,
//     name: 'Semarang',
//     region: 'Jawa Tengah',
//     lat: -6.9667,
//     lng: 110.4167,
//     status: 'trouble',
//     alarms: 15,
//   },
//   {
//     id: 4,
//     name: 'Surabaya',
//     region: 'Jawa Timur',
//     lat: -7.2575,
//     lng: 112.7521,
//     status: 'normal',
//     alarms: 31,
//   },
//   {
//     id: 5,
//     name: 'Balikpapan',
//     region: 'Kalimantan Timur',
//     lat: -1.2379,
//     lng: 116.8529,
//     status: 'normal',
//     alarms: 9,
//   },
//   {
//     id: 6,
//     name: 'Makassar',
//     region: 'Sulawesi Selatan',
//     lat: -5.1477,
//     lng: 119.4327,
//     status: 'trouble',
//     alarms: 12,
//   },
//   {
//     id: 7,
//     name: 'Jayapura',
//     region: 'Papua',
//     lat: -2.5489,
//     status: 'offline',
//     alarms: 0,
//   },
// ];

const colors = {
  normal: '#10b981',
  alarm: '#ef4444',
  trouble: '#f59e0b',
  offline: '#64748b',
};

const createMarker = (status: keyof typeof colors, count: number) =>
  L.divIcon({
    className: '',
    html: `
        <div class="soc-marker">

            <div
                class="pulse"
                style="background:${colors[status]}"
            ></div>

            <div
                class="core"
                style="background:${colors[status]}"
            >
                ${count}
            </div>

        </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const bounds: [[number, number], [number, number]] = [
  [-12, 94],
  [8, 142],
];

const SiteMap: React.FC<SiteMapProps> = ({ region, activeAlarmsBySite, height }) => {
  const displaySites = activeAlarmsBySite && activeAlarmsBySite.length > 0
    ? activeAlarmsBySite.map((site) => ({
        id: site.siteId,
        name: site.siteName,
        region: site.region,
        lat: site.latitude,
        lng: site.longitude,
        status: (site.status || 'normal').toLowerCase() as keyof typeof colors,
        alarms: site.totalAlarms,
      }))
    : [];

  // const filtered =
  //   region === 'Semua Region'
  //     ? displaySites
  //     : displaySites.filter((x) => x.region === region);
  console.log("SItem",displaySites)
  return (
    <Paper
      sx={{
        bgcolor: '#111827',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,.08)',
        overflow: 'hidden',
        height: height || '100%',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          PETA SEBARAN SITE
        </Typography>
      </Box>

      <Box
        sx={{
          height: height ? (typeof height === 'number' ? height - 90 : `calc(${height} - 90px)`) : 330,
        }}
      >
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          minZoom={5}
          maxZoom={15}
          maxBounds={bounds}
          maxBoundsViscosity={1}
          style={{
            height: '100%',
            width: '100%',
          }}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {displaySites.map((site) => (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={createMarker(site.status, site.alarms)}
            >
              <Popup>
                <b>{site.name}</b>

                <br />

                Region : {site.region}

                <br />

                Active Alarm : {site.alarms}

                <br />

                Status : {site.status}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
          py: 1,
          bgcolor: '#0f172a',
        }}
      >
        {Object.entries(colors).map(([k, v]) => (
          <Box
            key={k}
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: v,
              }}
            />

            <Typography
              sx={{
                color: '#CBD5E1',
                fontSize: 12,
                textTransform: 'capitalize',
              }}
            >
              {k}
            </Typography>
          </Box>
        ))}
      </Box>

      <style>
        {`

        .soc-marker{
            position:relative;
            width:36px;
            height:36px;
        }

        .soc-marker .pulse{

            position:absolute;

            width:36px;
            height:36px;

            border-radius:50%;

            animation:pulse 2s infinite;

            opacity:.35;

        }

        .soc-marker .core{

            position:absolute;

            width:28px;

            height:28px;

            left:4px;

            top:4px;

            border-radius:50%;

            display:flex;

            align-items:center;

            justify-content:center;

            color:white;

            font-size:11px;

            font-weight:bold;

            border:2px solid white;

            box-shadow:0 0 12px rgba(0,0,0,.5);

        }

        @keyframes pulse{

            0%{
                transform:scale(.8);
                opacity:.5;
            }

            70%{
                transform:scale(1.7);
                opacity:0;
            }

            100%{
                transform:scale(.8);
                opacity:0;
            }

        }

        .leaflet-container{
            background:#0f172a;
        }

        .leaflet-popup-content-wrapper{
            background:#111827;
            color:white;
        }

        .leaflet-popup-tip{
            background:#111827;
        }

        `}
      </style>
    </Paper>
  );
};

export default SiteMap;