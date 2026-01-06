{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, utils }: utils.lib.eachDefaultSystem (system:
    let
      pkgs = nixpkgs.legacyPackages.${system};
    in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            uv
            electron
            nodejs
            glib
            gtk3
            nss
            nspr
            at-spi2-atk
            at-spi2-core
            atk
            cairo
            cups
            dbus
            expat
            fontconfig
            freetype
            gdk-pixbuf
            pango
            mesa
            alsa-lib
          ];

          ELECTRON_PATH = "${pkgs.electron}/bin/electron";
          ELECTRON_OVERRIDE_DIST_PATH = "${pkgs.electron}/bin";

          LD_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath (with pkgs; [
            glib
            gtk3
            nss
            nspr
            at-spi2-atk
            at-spi2-core
            atk
            cairo
            cups
            dbus
            expat
            fontconfig
            freetype
            gdk-pixbuf
            pango
            mesa
            alsa-lib
            xorg.libX11
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrandr
            xorg.libxcb
            xorg.libxshmfence
          ])}:$LD_LIBRARY_PATH";

        };
      }
  );

}
