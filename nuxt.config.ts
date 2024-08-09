// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      googleMapsApiKey: '',
    }
  },
  app: {
    head: {
      script: [
        { src: "https://maps.googleapis.com/maps/api/js?key=&libraries=places" }
      ],
    }
  },
});

