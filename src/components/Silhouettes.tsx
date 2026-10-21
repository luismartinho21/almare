import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SilhouetteProps {
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Silhueta artística feminina (Beauty) — Perfil de mulher elegante e suave
 * No fundo branco da página inicial, surge subentendida em preto sutil
 */
export const WomanSilhouette: React.FC<SilhouetteProps> = ({
  color = '#000000',
  opacity = 0.08,
  style,
}) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg
        viewBox="0 0 400 650"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="womanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity * 1.5} />
            <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.6} />
          </LinearGradient>
        </Defs>

        <G fill="url(#womanGrad)">
          {/* Perfil e silhueta do rosto feminino, lábios delicados e pescoço gracioso */}
          <Path
            d="
              M 150 90
              C 195 90 230 115 245 150
              C 252 165 248 180 236 195
              C 230 202 232 208 244 218
              C 252 225 254 232 246 237
              C 236 242 230 246 233 254
              C 239 261 236 268 228 271
              C 220 273 223 282 230 288
              C 228 296 220 304 210 307
              C 198 310 186 320 182 334
              C 175 356 180 385 192 418
              C 206 454 230 490 262 528
              C 290 560 325 585 365 600
              L 30 600
              C 42 555 58 510 80 468
              C 102 425 122 382 132 340
              C 137 312 131 285 120 258
              C 108 230 96 198 102 160
              C 111 116 130 90 150 90
              Z
            "
          />

          {/* Cabelo fluido, ondas elegantes e textura estética feminina */}
          <Path
            d="
              M 145 75
              C 190 75 235 102 255 140
              C 268 165 270 195 262 220
              C 254 198 242 180 228 165
              C 205 140 178 126 145 126
              C 112 126 85 140 68 165
              C 55 188 52 215 55 242
              C 60 285 78 328 88 370
              C 96 408 98 450 86 492
              C 76 525 60 558 38 590
              L 15 590
              C 38 550 58 510 68 468
              C 78 420 75 378 64 335
              C 52 292 42 250 38 208
              C 34 160 52 118 85 98
              C 103 87 125 75 145 75
              Z
            "
          />

          {/* Ondulação suave de madeixas ao longo da silhueta */}
          <Path
            d="
              M 175 160
              C 205 165 230 185 240 210
              C 230 210 215 200 200 190
              C 185 180 170 175 155 175
              C 135 175 120 185 113 200
              C 107 212 105 228 107 245
              C 110 275 120 305 125 335
              C 130 365 127 395 120 425
              L 110 422
              C 117 395 119 365 115 335
              C 110 305 100 275 97 245
              C 95 225 97 205 105 190
              C 115 170 140 158 175 160
              Z
            "
          />
        </G>
      </Svg>
    </View>
  );
};

/**
 * Silhueta artística masculina (Barber) — Perfil de homem com barba estilizada e corte moderno
 * No fundo preto da página inicial, surge subentendido em branco sutil
 */
export const ManSilhouette: React.FC<SilhouetteProps> = ({
  color = '#FFFFFF',
  opacity = 0.12,
  style,
}) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg
        viewBox="0 0 400 650"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="manGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity * 1.5} />
            <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.6} />
          </LinearGradient>
        </Defs>

        <G fill="url(#manGrad)">
          {/* Perfil masculino, barba esculpida e linha do maxilar marcante */}
          <Path
            d="
              M 250 90
              C 205 90 170 115 155 150
              C 148 165 152 180 164 195
              C 170 202 168 208 156 218
              C 148 225 146 232 154 237
              C 164 242 170 246 167 254
              C 161 261 164 268 172 271
              C 180 273 177 282 170 288
              C 172 296 180 304 190 307
              C 202 310 214 320 218 334
              C 225 356 220 385 208 418
              C 194 454 170 490 138 528
              C 110 560 75 585 35 600
              L 370 600
              C 358 555 342 510 320 468
              C 298 425 278 382 268 340
              C 263 312 269 285 280 258
              C 292 230 304 198 298 160
              C 289 116 270 90 250 90
              Z
            "
          />

          {/* Topete quiff/fade de barbearia e definição do contorno da cabeça */}
          <Path
            d="
              M 255 75
              C 210 75 165 102 145 140
              C 132 165 130 195 138 220
              C 146 198 158 180 172 165
              C 195 140 222 126 255 126
              C 288 126 315 140 332 165
              C 345 188 348 215 345 242
              C 340 285 322 328 312 370
              C 304 408 302 450 314 492
              C 324 525 340 558 362 590
              L 385 590
              C 362 550 342 510 332 468
              C 322 420 325 378 336 335
              C 348 292 358 250 362 208
              C 366 160 348 118 315 98
              C 297 87 275 75 255 75
              Z
            "
          />

          {/* Linha de corte fade / definição de barba de barbearia */}
          <Path
            d="
              M 225 160
              C 195 165 170 185 160 210
              C 170 210 185 200 200 190
              C 215 180 230 175 245 175
              C 265 175 280 185 287 200
              C 293 212 295 228 293 245
              C 290 275 280 305 275 335
              C 270 365 273 395 280 425
              L 290 422
              C 283 395 281 365 285 335
              C 290 305 300 275 303 245
              C 305 225 303 205 295 190
              C 285 170 260 158 225 160
              Z
            "
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
