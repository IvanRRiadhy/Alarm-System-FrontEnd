import {
  FormControl,
  MenuItem,
  Select,
} from '@mui/material';

type Props = {
  region: string;
  onChange: (value: string) => void;
};

const HeaderRegion = ({
  region,
  onChange,
}: Props) => {
  return (
    <FormControl size="small">
      <Select
        value={region}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          minWidth: 170,
          bgcolor: '#0F172A',
          color: '#fff',

          '.MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,.1)',
          },

          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563EB',
          },

          '.MuiSvgIcon-root': {
            color: '#fff',
          },
        }}
      >
        <MenuItem value="Semua Region">
          Semua Region
        </MenuItem>

        <MenuItem value="Jabodetabek">
          Jabodetabek
        </MenuItem>

        <MenuItem value="Jawa Barat">
          Jawa Barat
        </MenuItem>

        <MenuItem value="Jawa Tengah">
          Jawa Tengah
        </MenuItem>

        <MenuItem value="Jawa Timur">
          Jawa Timur
        </MenuItem>

        <MenuItem value="Sumatera">
          Sumatera
        </MenuItem>

        <MenuItem value="Kalimantan">
          Kalimantan
        </MenuItem>

        <MenuItem value="Sulawesi">
          Sulawesi
        </MenuItem>

        <MenuItem value="Papua">
          Papua
        </MenuItem>
      </Select>
    </FormControl>
  );
};

export default HeaderRegion;