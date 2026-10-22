import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SilhouetteProps {
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Silhueta artística feminina (Beauty) — Perfil elegante com CABELO COMPRIDO
 * Muito parecida de perfil com o homem, virada para o centro, com longas madeixas fluidas.
 */
export const WomanSilhouette: React.FC<SilhouetteProps> = ({
  color = '#000000',
  opacity = 0.08,
  style,
}) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg
        viewBox="0 0 400 520"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="womanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity * 1.5} />
            <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.7} />
          </LinearGradient>
        </Defs>

        <G fill="url(#womanGrad)">
          {/* Perfil facial delicado + Pescoço e Base */}
          <Path
            d="
              M 195 140
              C 208 152 218 168 225 185
              C 222 192 225 198 232 208
              C 237 215 240 220 240 225
              C 232 230 225 233 224 236
              C 223 242 226 246 228 248
              C 233 251 235 253 235 254
              C 228 256 226 257 225 258
              C 226 263 230 266 232 268
              C 226 272 223 275 222 278
              C 223 285 226 290 228 295
              C 220 300 214 303 210 305
              C 202 318 206 338 215 365
              C 226 398 245 430 275 460
              C 295 480 325 500 360 515
              L 40 515
              C 35 480 30 430 35 375
              C 42 315 55 255 75 200
              C 95 150 135 110 175 105
              C 185 115 192 128 195 140
              Z
            "
          />

          {/* Cabelo Comprido Fluido descendo pelas costas e ombro */}
          <Path
            d="
              M 175 105
              C 130 110 88 150 68 205
              C 48 260 38 325 40 390
              C 42 435 50 480 65 515
              L 40 515
              C 25 475 18 430 16 385
              C 14 320 25 252 48 195
              C 70 138 115 95 165 90
              C 180 88 195 92 208 100
              C 196 100 184 102 175 105
              Z
            "
          />

          {/* Madeixas compridas femininas com textura e ondulação */}
          <Path
            d="
              M 195 140
              C 180 148 165 165 155 190
              C 142 220 138 258 142 298
              C 146 338 158 378 172 418
              C 182 445 195 472 210 500
              C 215 508 218 515 220 515
              L 205 515
              C 195 485 180 455 168 425
              C 152 385 138 342 132 298
              C 126 252 130 210 145 175
              C 158 145 178 135 195 140
              Z
            "
          />
        </G>
      </Svg>
    </View>
  );
};

/**
 * Silhueta artística masculina (Barber) — Perfil elegante com CORTE CURTO
 * Perfil simétrico e harmónico com a mulher, virado para o centro, com corte curto limpo e nuca visível.
 */
export const ManSilhouette: React.FC<SilhouetteProps> = ({
  color = '#FFFFFF',
  opacity = 0.12,
  style,
}) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg
        viewBox="0 0 400 520"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="manGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity * 1.5} />
            <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.7} />
          </LinearGradient>
        </Defs>

        <G fill="url(#manGrad)">
          {/* Perfil facial harmónico espelhado + Pescoço masculino e Ombro */}
          <Path
            d="
              M 205 140
              C 192 152 182 168 175 185
              C 178 192 175 198 168 208
              C 163 215 160 220 160 225
              C 168 230 175 233 176 236
              C 177 242 174 246 172 248
              C 167 251 165 253 165 254
              C 172 256 174 257 175 258
              C 174 263 170 266 168 268
              C 174 272 177 275 178 278
              C 177 285 174 290 172 295
              C 180 300 186 303 190 305
              C 198 318 194 338 185 365
              C 174 398 155 430 125 460
              C 105 480 75 500 40 515
              L 360 515
              C 355 470 345 425 330 380
              C 318 340 305 305 295 275
              C 290 260 288 245 288 230
              C 288 205 295 180 305 160
              C 300 140 285 120 265 110
              C 245 102 225 108 210 118
              C 206 125 204 132 205 140
              Z
            "
          />

          {/* Corte Curto Masculino (Corte curto, degradé limpo, nuca e ombros livres de cabelo comprido) */}
          <Path
            d="
              M 210 118
              C 225 108 245 102 265 110
              C 285 120 300 140 305 160
              C 310 170 312 182 312 195
              C 305 190 298 188 290 188
              C 275 188 262 195 252 208
              C 245 218 240 230 240 245
              C 240 252 242 260 245 268
              C 238 262 230 258 220 258
              C 205 258 195 268 190 280
              L 188 275
              C 192 260 202 250 215 250
              C 225 250 232 255 238 260
              C 235 248 238 235 246 224
              C 255 212 268 205 282 205
              C 292 205 300 208 306 215
              C 305 200 300 185 292 175
              C 282 160 268 152 250 152
              C 232 152 218 160 208 172
              L 205 168
              C 205 155 206 145 208 135
              C 208 128 209 122 210 118
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
